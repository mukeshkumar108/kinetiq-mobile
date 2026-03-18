import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOAuth, useSignIn, useSignUp } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";

import { Glow } from "@/shared/ui/base/glow";
import { Button } from "@/shared/ui/base/button";
import SpinButton from "@/shared/ui/micro-interactions/spin-button";
import GrainyGradient from "@/shared/ui/organisms/grainy-gradient";
import { colors } from "@/shared/theme/colors";

WebBrowser.maybeCompleteAuthSession();

type Screen = "choice" | "sign-in" | "sign-up" | "verify-email";

export function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, setActive: setSignInActive, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: signUpLoaded } = useSignUp();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  const [screen, setScreen] = useState<Screen>("choice");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState<"sign-in" | "sign-up" | null>(null);

  const reset = () => {
    setError("");
    setCode("");
  };

  const headerCopy = useMemo(() => {
    switch (screen) {
      case "sign-in":
        return {
          eyebrow: "Come back sharper",
          title: "Lock in for today.",
          subtitle: "Your habits, focus tasks, XP, and streaks pick up right where you left them.",
        };
      case "sign-up":
        return {
          eyebrow: "Start the loop",
          title: "Build momentum that sticks.",
          subtitle: "Kinetiq turns habits and to-dos into a dark, rewarding daily rhythm.",
        };
      case "verify-email":
        return {
          eyebrow: "One more step",
          title: "Check your inbox.",
          subtitle: `We sent a code to ${email || "your email"} to secure the session.`,
        };
      default:
        return {
          eyebrow: "Kinetiq",
          title: "Habits with velocity.",
          subtitle: "A momentum-first space for rituals, focus, streaks, and daily wins.",
        };
    }
  }, [email, screen]);

  const handleGoogle = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const { createdSessionId, setActive } = await startOAuthFlow();
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Google auth failed");
    } finally {
      setLoading(false);
    }
  }, [startOAuthFlow]);

  const handleSignIn = useCallback(async () => {
    if (!signInLoaded || !signIn) return;
    reset();
    setLoading(true);
    try {
      const result = await signIn.create({ identifier: email, password });

      if (result.status === "complete") {
        await setSignInActive!({ session: result.createdSessionId });
        return;
      }

      if (
        result.status === "needs_second_factor" ||
        result.status === "needs_first_factor"
      ) {
        const allFactors = [
          ...(result.supportedFirstFactors ?? []),
          ...(result.supportedSecondFactors ?? []),
        ];
        const emailFactor = allFactors.find((factor) => factor.strategy === "email_code");

        if (emailFactor && "emailAddressId" in emailFactor) {
          const emailAddressId = (emailFactor as { emailAddressId: string }).emailAddressId;
          if (result.status === "needs_first_factor") {
            await signIn.prepareFirstFactor({ strategy: "email_code", emailAddressId });
          } else {
            await (signIn as any).prepareSecondFactor({ strategy: "email_code", emailAddressId });
          }
          setPendingVerification("sign-in");
          setScreen("verify-email");
          return;
        }

        setError("Verification is required, but email verification is not available on this account.");
        return;
      }

      setError(`Unexpected status: ${result.status}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  }, [signInLoaded, signIn, setSignInActive, email, password]);

  const handleSignUp = useCallback(async () => {
    if (!signUpLoaded || !signUp) return;
    reset();
    setLoading(true);
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification("sign-up");
      setScreen("verify-email");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign-up failed");
    } finally {
      setLoading(false);
    }
  }, [signUpLoaded, signUp, email, password]);

  const handleVerify = useCallback(async () => {
    reset();
    setLoading(true);
    try {
      if (pendingVerification === "sign-up" && signUp) {
        const result = await signUp.attemptEmailAddressVerification({ code });
        if (result.status === "complete") {
          await setSignUpActive!({ session: result.createdSessionId });
          return;
        }
        setError(`Sign-up verification status: ${result.status}`);
      }

      if (pendingVerification === "sign-in" && signIn) {
        let result;
        try {
          result = await signIn.attemptFirstFactor({ strategy: "email_code", code });
        } catch {
          result = await (signIn as any).attemptSecondFactor({ strategy: "email_code", code });
        }
        if (result.status === "complete") {
          await setSignInActive!({ session: result.createdSessionId });
          return;
        }
        setError(`Sign-in verification status: ${result.status}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }, [pendingVerification, signIn, signUp, setSignInActive, setSignUpActive, code]);

  const renderForm = () => {
    if (screen === "choice") {
      return (
        <>
          <Glow
            color={colors.accent}
            secondaryColor={colors.accentElectric}
            radius={22}
            size={7}
            intensity={0.6}
            style="breathe"
          >
            <View style={s.primaryButtonWrap}>
              <Button
                onPress={handleGoogle}
                isLoading={loading}
                loadingText="Connecting"
                loadingTextColor={colors.text}
                loadingTextBackgroundColor={colors.accent}
                width={"100%" as never}
                height={58}
                borderRadius={18}
                backgroundColor={colors.cardStrong}
                gradientColors={[colors.accent, colors.accentElectric]}
                style={s.googleButton}
              >
                <View style={s.googleInner}>
                  <Ionicons name="logo-google" size={18} color={colors.text} />
                  <Text style={s.googleText}>Continue with Google</Text>
                </View>
              </Button>
            </View>
          </Glow>

          <View style={s.dividerRow}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>or use email</Text>
            <View style={s.dividerLine} />
          </View>

          <Pressable
            style={s.secondaryAction}
            onPress={() => {
              setError("");
              setScreen("sign-in");
            }}
          >
            <Text style={s.secondaryActionText}>Sign in with email</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.textSoft} />
          </Pressable>

          <Pressable
            style={s.tertiaryAction}
            onPress={() => {
              setError("");
              setScreen("sign-up");
            }}
          >
            <Text style={s.tertiaryActionText}>New here? Create an account</Text>
          </Pressable>
        </>
      );
    }

    if (screen === "verify-email") {
      return (
        <>
          <View style={s.fieldWrap}>
            <Text style={s.fieldLabel}>Verification code</Text>
            <TextInput
              style={s.input}
              placeholder="6-digit code"
              placeholderTextColor={colors.textMuted}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              autoFocus
            />
          </View>
          {error ? <Text style={s.error}>{error}</Text> : null}
          <View style={s.spinWrap}>
            <SpinButton
              idleText="Verify code"
              activeText="Verifying"
              controlled
              isActive={loading}
              disabled={loading}
              onPress={() => void handleVerify()}
              colors={{
                idle: { background: colors.text, text: colors.bg },
                active: { background: colors.accent, text: colors.text },
              }}
              buttonStyle={{
                paddingHorizontal: 30,
                paddingVertical: 16,
                borderRadius: 18,
                fontSize: 16,
                fontWeight: "700",
              }}
            />
          </View>
        </>
      );
    }

    const primaryAction = screen === "sign-in" ? handleSignIn : handleSignUp;

    return (
      <>
        <View style={s.fieldWrap}>
          <Text style={s.fieldLabel}>Email</Text>
          <TextInput
            style={s.input}
            placeholder="you@kinetiq.app"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>
        <View style={s.fieldWrap}>
          <Text style={s.fieldLabel}>Password</Text>
          <TextInput
            style={s.input}
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>
        {error ? <Text style={s.error}>{error}</Text> : null}
        <View style={s.spinWrap}>
          <SpinButton
            idleText={screen === "sign-in" ? "Enter Kinetiq" : "Create account"}
            activeText={screen === "sign-in" ? "Entering" : "Creating"}
            controlled
            isActive={loading}
            disabled={loading}
            onPress={() => void primaryAction()}
            colors={{
              idle: { background: colors.text, text: colors.bg },
              active: { background: colors.accent, text: colors.text },
            }}
            buttonStyle={{
              paddingHorizontal: 30,
              paddingVertical: 16,
              borderRadius: 18,
              fontSize: 16,
              fontWeight: "700",
            }}
          />
        </View>
      </>
    );
  };

  if (!signInLoaded || !signUpLoaded) {
    return (
      <View style={s.loadingScreen}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <GrainyGradient
        colors={["#0A0F1F", "#1A1440", "#102A52", "#101723"]}
        intensity={0.075}
        amplitude={0.12}
        brightness={-0.08}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, s.bgOverlay]} />

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            s.scrollContent,
            { paddingTop: insets.top + 28, paddingBottom: Math.max(insets.bottom, 24) + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.hero}>
            <Text style={s.eyebrow}>{headerCopy.eyebrow}</Text>
            <Text style={s.title}>{headerCopy.title}</Text>
            <Text style={s.subtitle}>{headerCopy.subtitle}</Text>

            <View style={s.momentumRow}>
              <View style={s.momentumChip}>
                <Ionicons name="flash" size={12} color={colors.accentElectric} />
                <Text style={s.momentumChipText}>Momentum-first</Text>
              </View>
              <View style={s.momentumChip}>
                <Ionicons name="flame" size={12} color={colors.streak} />
                <Text style={s.momentumChipText}>Streak energy</Text>
              </View>
              <View style={s.momentumChip}>
                <Ionicons name="sparkles" size={12} color={colors.xp} />
                <Text style={s.momentumChipText}>XP rewards</Text>
              </View>
            </View>
          </View>

          <View style={s.card}>
            {renderForm()}

            {screen !== "choice" ? (
              <Pressable
                style={s.backRow}
                onPress={() => {
                  setScreen("choice");
                  reset();
                  setPendingVerification(null);
                }}
              >
                <Ionicons name="arrow-back" size={14} color={colors.textMuted} />
                <Text style={s.backText}>Back</Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  bgOverlay: {
    backgroundColor: "rgba(4, 6, 12, 0.52)",
  },
  loadingScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: "space-between",
    gap: 24,
  },
  hero: {
    gap: 12,
    paddingTop: 12,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.3,
    textTransform: "uppercase",
    color: colors.accentElectric,
  },
  title: {
    fontSize: 40,
    lineHeight: 42,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    maxWidth: 320,
    fontSize: 16,
    lineHeight: 23,
    color: colors.textSoft,
  },
  momentumRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },
  momentumChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(10, 14, 22, 0.46)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  momentumChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
  card: {
    backgroundColor: "rgba(11, 14, 20, 0.78)",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.cardBorderStrong,
    padding: 18,
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
  },
  primaryButtonWrap: {
    width: "100%",
  },
  googleButton: {
    width: "100%",
  },
  googleInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  googleText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  dividerText: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  secondaryAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  secondaryActionText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  tertiaryAction: {
    alignItems: "center",
    paddingVertical: 6,
  },
  tertiaryActionText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSoft,
  },
  fieldWrap: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSoft,
  },
  input: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: colors.text,
  },
  error: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.danger,
  },
  spinWrap: {
    alignItems: "flex-start",
    marginTop: 4,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 6,
    marginTop: 4,
  },
  backText: {
    fontSize: 14,
    color: colors.textMuted,
  },
});

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

import { Button } from "@/shared/ui/base/button";
import SpinButton from "@/shared/ui/micro-interactions/spin-button";
import GrainyGradient from "@/shared/ui/organisms/grainy-gradient";
import { colors } from "@/shared/theme/colors";

WebBrowser.maybeCompleteAuthSession();

type Screen = "choice" | "sign-in" | "sign-up" | "verify-email";

const vibe = {
  cyan: "#34C6FF",
  ember: "#FF6B2C",
  emberSoft: "#FF8A4C",
  panel: "rgba(13, 15, 20, 0.82)",
  line: "rgba(255,255,255,0.1)",
  textSoft: "#C7D0EA",
};

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
          eyebrow: "Back on the floor",
          title: "Train your momentum.",
          subtitle: "Your rituals, focus blocks, and streak pressure are waiting exactly where you left them.",
        };
      case "sign-up":
        return {
          eyebrow: "Enter the circuit",
          title: "Build a harder daily rhythm.",
          subtitle: "Kinetiq turns habits and focus into a late-night training board for your real life.",
        };
      case "verify-email":
        return {
          eyebrow: "Final gate",
          title: "Confirm your entry.",
          subtitle: `We sent a code to ${email || "your email"} so this session stays locked to you.`,
        };
      default:
        return {
          eyebrow: "Kinetiq",
          title: "Discipline after dark.",
          subtitle: "A high-energy habits and focus system built like a scoreboard, not a spreadsheet.",
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
          <Pressable
            style={[s.googlePressable, loading && s.googlePressableDisabled]}
            onPress={() => void handleGoogle()}
            disabled={loading}
          >
            <LinearButtonSurface>
              {loading ? (
                <ActivityIndicator color={colors.bg} />
              ) : (
                <View style={s.googleInner}>
                  <Ionicons name="logo-google" size={18} color={colors.bg} />
                  <Text style={s.googleText}>Enter with Google</Text>
                </View>
              )}
            </LinearButtonSurface>
          </Pressable>

          <View style={s.dividerRow}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>or run email</Text>
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
            <Ionicons name="arrow-forward" size={16} color={vibe.ember} />
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
                idle: { background: vibe.ember, text: colors.text },
                active: { background: vibe.emberSoft, text: colors.text },
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
              idle: { background: vibe.ember, text: colors.text },
              active: { background: vibe.emberSoft, text: colors.text },
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
        colors={["#050608", "#140A0A", "#07131D", "#1B0F0A"]}
        intensity={0.04}
        amplitude={0.05}
        brightness={-0.12}
        animated={false}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, s.bgOverlay]} />

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
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
                <Ionicons name="flash" size={12} color={vibe.cyan} />
                <Text style={s.momentumChipText}>Momentum board</Text>
              </View>
              <View style={s.momentumChip}>
                <Ionicons name="flame" size={12} color={vibe.ember} />
                <Text style={s.momentumChipText}>Streak heat</Text>
              </View>
              <View style={s.momentumChip}>
                <Ionicons name="trophy" size={12} color={colors.text} />
                <Text style={s.momentumChipText}>XP pressure</Text>
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

function LinearButtonSurface({ children }: { children: React.ReactNode }) {
  return (
    <View style={s.googleSurface}>
      <View style={s.googleGradientSurface}>{children}</View>
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
    backgroundColor: "rgba(2, 3, 6, 0.6)",
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
    letterSpacing: 2.2,
    textTransform: "uppercase",
    color: vibe.cyan,
  },
  title: {
    fontSize: 44,
    lineHeight: 46,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    maxWidth: 336,
    fontSize: 16,
    lineHeight: 23,
    color: vibe.textSoft,
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
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: vibe.line,
  },
  momentumChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
  card: {
    backgroundColor: vibe.panel,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 44, 0.16)",
    padding: 20,
    gap: 16,
    shadowColor: "#000",
    shadowOpacity: 0.34,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
  },
  googlePressable: {
    width: "100%",
  },
  googlePressableDisabled: {
    opacity: 0.72,
  },
  googleSurface: {
    borderRadius: 20,
    padding: 1,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  googleGradientSurface: {
    minHeight: 60,
    borderRadius: 19,
    backgroundColor: vibe.cyan,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  googleInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  googleText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.bg,
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
    color: vibe.textSoft,
    textTransform: "uppercase",
    letterSpacing: 1.8,
  },
  secondaryAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 44, 0.15)",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "rgba(255, 107, 44, 0.05)",
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
    color: vibe.textSoft,
  },
  fieldWrap: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: vibe.textSoft,
    textTransform: "uppercase",
    letterSpacing: 1.2,
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

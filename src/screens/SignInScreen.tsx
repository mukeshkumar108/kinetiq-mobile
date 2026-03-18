import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSignIn, useSignUp, useOAuth } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

type Screen = "choice" | "sign-in" | "sign-up" | "verify-email";

export function SignInScreen() {
  const { signIn, setActive: setSignInActive, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: signUpLoaded } = useSignUp();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  const [screen, setScreen] = useState<Screen>("choice");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // Track which flow triggered verification so we call the right attempt method
  const [pendingVerification, setPendingVerification] = useState<"sign-in" | "sign-up" | null>(null);

  const reset = () => {
    setError("");
    setCode("");
  };

  // ── Google OAuth (works for both sign-in and sign-up) ──
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

  // ── Sign In with email + password ──
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

      // Clerk requires email verification as an additional step.
      // This is NOT MFA — it's email verification baked into the sign-in flow.
      if (
        result.status === "needs_second_factor" ||
        result.status === "needs_first_factor"
      ) {
        const allFactors = [
          ...(result.supportedFirstFactors ?? []),
          ...(result.supportedSecondFactors ?? []),
        ];
        const emailFactor = allFactors.find((f) => f.strategy === "email_code");

        if (emailFactor && "emailAddressId" in emailFactor) {
          // Prepare = tells Clerk to send the verification email.
          // Clerk returns email_code in either first or second factors depending
          // on instance config. We use the matching prepare method.
          const emailAddressId = (emailFactor as { emailAddressId: string }).emailAddressId;
          if (result.status === "needs_first_factor") {
            await signIn.prepareFirstFactor({ strategy: "email_code", emailAddressId });
          } else {
            // Clerk types don't include email_code for second factor, but the API accepts it.
            await (signIn as any).prepareSecondFactor({ strategy: "email_code", emailAddressId });
          }
          setPendingVerification("sign-in");
          setScreen("verify-email");
          return;
        }

        setError(`Verification required but no email_code strategy found. Factors: ${JSON.stringify(allFactors)}`);
        return;
      }

      setError(`Unexpected status: ${result.status}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  }, [signInLoaded, signIn, setSignInActive, email, password]);

  // ── Sign Up with email + password ──
  const handleSignUp = useCallback(async () => {
    if (!signUpLoaded || !signUp) return;
    reset();
    setLoading(true);
    try {
      await signUp.create({ emailAddress: email, password });

      // Clerk sends a verification email automatically during sign-up
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification("sign-up");
      setScreen("verify-email");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign-up failed");
    } finally {
      setLoading(false);
    }
  }, [signUpLoaded, signUp, email, password]);

  // ── Verify the email code (works for both sign-in and sign-up) ──
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
        // Try first factor, then second factor
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

  if (!signInLoaded || !signUpLoaded) {
    return <View style={s.container}><ActivityIndicator /></View>;
  }

  // ── Email verification screen ──
  if (screen === "verify-email") {
    return (
      <KeyboardAvoidingView style={s.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Text style={s.heading}>Check your email</Text>
        <Text style={s.sub}>We sent a code to {email}</Text>
        <TextInput
          style={s.input}
          placeholder="Verification code" placeholderTextColor="#555"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          autoFocus
        />
        {error ? <Text style={s.error}>{error}</Text> : null}
        <Pressable style={s.btn} onPress={handleVerify} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Verify</Text>}
        </Pressable>
        <Pressable style={s.link} onPress={() => { setScreen("choice"); reset(); setPendingVerification(null); }}>
          <Text style={s.linkText}>Back</Text>
        </Pressable>
      </KeyboardAvoidingView>
    );
  }

  // ── Sign-in form ──
  if (screen === "sign-in") {
    return (
      <KeyboardAvoidingView style={s.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Text style={s.heading}>Sign in</Text>
        <TextInput style={s.input} placeholder="Email" placeholderTextColor="#555" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextInput style={s.input} placeholder="Password" placeholderTextColor="#555" value={password} onChangeText={setPassword} secureTextEntry />
        {error ? <Text style={s.error}>{error}</Text> : null}
        <Pressable style={s.btn} onPress={handleSignIn} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Sign in</Text>}
        </Pressable>
        <Pressable style={s.link} onPress={() => { setScreen("choice"); setError(""); }}>
          <Text style={s.linkText}>Back</Text>
        </Pressable>
      </KeyboardAvoidingView>
    );
  }

  // ── Sign-up form ──
  if (screen === "sign-up") {
    return (
      <KeyboardAvoidingView style={s.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Text style={s.heading}>Create account</Text>
        <TextInput style={s.input} placeholder="Email" placeholderTextColor="#555" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextInput style={s.input} placeholder="Password" placeholderTextColor="#555" value={password} onChangeText={setPassword} secureTextEntry />
        {error ? <Text style={s.error}>{error}</Text> : null}
        <Pressable style={s.btn} onPress={handleSignUp} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Create account</Text>}
        </Pressable>
        <Pressable style={s.link} onPress={() => { setScreen("choice"); setError(""); }}>
          <Text style={s.linkText}>Back</Text>
        </Pressable>
      </KeyboardAvoidingView>
    );
  }

  // ── Choice screen ──
  return (
    <View style={s.container}>
      <Text style={s.heading}>Kinetiq</Text>
      <Text style={s.sub}>Diagnostic auth</Text>

      <Pressable style={s.google} onPress={handleGoogle} disabled={loading}>
        <Text style={s.googleText}>Continue with Google</Text>
      </Pressable>

      <Text style={s.divider}>— or —</Text>

      <Pressable style={s.btn} onPress={() => { setError(""); setScreen("sign-in"); }}>
        <Text style={s.btnText}>Sign in with email</Text>
      </Pressable>

      <Pressable style={s.link} onPress={() => { setError(""); setScreen("sign-up"); }}>
        <Text style={s.linkText}>Create an account</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#000" },
  heading: { fontSize: 28, fontWeight: "700", marginBottom: 4, color: "#fff" },
  sub: { fontSize: 13, color: "#888", marginBottom: 24 },
  google: { borderWidth: 1, borderColor: "#333", padding: 14, borderRadius: 10, alignItems: "center", marginBottom: 16, backgroundColor: "#1A1A1A" },
  googleText: { fontSize: 16, fontWeight: "600", color: "#fff" },
  divider: { textAlign: "center", color: "#555", fontSize: 13, marginVertical: 16 },
  input: { borderWidth: 1, borderColor: "#333", borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 16, color: "#fff", backgroundColor: "#1A1A1A" },
  error: { color: "#EF4444", marginBottom: 12, fontSize: 13 },
  btn: { backgroundColor: "#7C5CFC", padding: 14, borderRadius: 10, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  link: { marginTop: 16, alignItems: "center" },
  linkText: { color: "#888", fontSize: 14 },
});

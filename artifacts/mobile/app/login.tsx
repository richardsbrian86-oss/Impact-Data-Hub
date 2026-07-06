import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useLogin } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/auth-context";

export default function LoginScreen() {
  const colors = useColors();
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const login = useLogin({
    mutation: {
      onSuccess: async (data) => {
        await signIn(data.token);
        router.replace("/(tabs)");
      },
      onError: (err) => {
        const data = err.data;
        setError(data?.error ?? "Unable to sign in. Please try again.");
      },
    },
  });

  const handleSubmit = () => {
    setError(null);
    login.mutate({ data: { email: email.trim(), password } });
  };

  const inputStyle = [
    styles.input,
    {
      backgroundColor: colors.muted,
      borderColor: colors.border,
      color: colors.foreground,
    },
  ];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.inner}>
        <Text style={[styles.title, { color: colors.foreground }]}>ImpactIQ</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Sign in to continue
        </Text>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Text style={[styles.label, { color: colors.mutedForeground }]}>Email</Text>
        <TextInput
          style={inputStyle}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          autoComplete="email"
          placeholder="you@example.org"
          placeholderTextColor={colors.mutedForeground}
        />

        <Text style={[styles.label, { color: colors.mutedForeground }]}>
          Password
        </Text>
        <TextInput
          style={inputStyle}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
          placeholder="••••••••"
          placeholderTextColor={colors.mutedForeground}
          onSubmitEditing={handleSubmit}
          returnKeyType="go"
        />

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={login.isPending}
          style={[
            styles.button,
            { backgroundColor: colors.primary, opacity: login.isPending ? 0.7 : 1 },
          ]}
        >
          {login.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    maxWidth: 420,
    width: "100%",
    alignSelf: "center",
  },
  title: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 28,
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  errorBox: {
    backgroundColor: "#ef444418",
    borderColor: "#ef4444",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 4,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});

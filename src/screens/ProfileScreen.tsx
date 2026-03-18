import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@clerk/clerk-expo";
import { useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useMe } from "@/modules/auth/hooks";
import { useProgression } from "@/modules/progression/hooks";
import { colors } from "@/shared/theme/colors";

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const queryClient = useQueryClient();
  const me = useMe();
  const progression = useProgression();

  const displayName =
    me.data?.profile?.displayName ||
    me.data?.profile?.firstName ||
    me.data?.email ||
    "User";

  return (
    <View style={[s.container, { paddingTop: insets.top + 16 }]}>
      <Text style={s.heading}>Profile</Text>

      <View style={s.card}>
        <View style={s.avatarCircle}>
          <Ionicons name="person" size={32} color={colors.accent} />
        </View>
        <Text style={s.name}>{displayName}</Text>
        {me.data?.email && (
          <Text style={s.email}>{me.data.email}</Text>
        )}
      </View>

      {progression.data && (
        <View style={s.card}>
          <Text style={s.statLabel}>Level {progression.data.level}</Text>
          <Text style={s.statValue}>{progression.data.totalXp} total XP</Text>
        </View>
      )}

      <Pressable
        style={s.signOutBtn}
        onPress={async () => {
          await signOut();
          queryClient.clear();
        }}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text style={s.signOutText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 24,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.cardBorder,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  email: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.accent,
  },
  statValue: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginTop: "auto",
    marginBottom: 20,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.danger,
  },
});

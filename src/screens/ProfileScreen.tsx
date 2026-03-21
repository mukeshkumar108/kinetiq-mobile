import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@clerk/clerk-expo";
import { useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useMe } from "@/modules/auth/hooks";
import { useProgression } from "@/modules/progression/hooks";
import { color, font, space, radius, CONTENT_PADDING, cardShadow } from "@/shared/theme/tokens";
import { PressableScale } from "@/shared/ui/PressableScale";

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
    <ScrollView
      style={s.container}
      contentContainerStyle={[
        s.content,
        { paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space["3xl"] },
      ]}
    >
      <Text style={s.heading}>Profile</Text>

      <View style={s.card}>
        <View style={s.avatarCircle}>
          <Ionicons name="person" size={32} color={color.mint} />
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

      <View style={{ flex: 1, minHeight: space["5xl"] }} />

      <PressableScale
        style={s.signOutBtn}
        onPress={async () => {
          await signOut();
          queryClient.clear();
        }}
      >
        <Ionicons name="log-out-outline" size={20} color={color.danger} />
        <Text style={s.signOutText}>Sign out</Text>
      </PressableScale>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.bg,
  },
  content: {
    paddingHorizontal: CONTENT_PADDING,
    flexGrow: 1,
  },
  heading: {
    ...font.display,
    marginBottom: space["2xl"],
  },
  card: {
    backgroundColor: color.bgCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: color.border,
    padding: space.xl,
    alignItems: "center",
    marginBottom: space.lg,
    ...cardShadow,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: color.mintMuted,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: space.md,
  },
  name: {
    ...font.headline,
  },
  email: {
    ...font.caption,
    marginTop: space.xs,
  },
  statLabel: {
    ...font.body,
    fontWeight: "600",
    color: color.mint,
  },
  statValue: {
    ...font.caption,
    marginTop: space.xs,
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
    padding: space.lg,
    borderRadius: radius.xl,
    backgroundColor: color.bgCard,
    borderWidth: 1,
    borderColor: color.border,
  },
  signOutText: {
    ...font.body,
    fontWeight: "600",
    color: color.danger,
  },
});

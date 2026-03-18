import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ComponentProps } from "react";
import { colors } from "@/shared/theme/colors";

type IconName = ComponentProps<typeof Ionicons>["name"];

interface StateCardProps {
  title: string;
  description: string;
  icon: IconName;
  actionLabel?: string;
  onAction?: () => void;
}

export function StateCard({
  title,
  description,
  icon,
  actionLabel,
  onAction,
}: StateCardProps) {
  return (
    <View style={s.card}>
      <Ionicons name={icon} size={28} color={colors.textMuted} />
      <Text style={s.title}>{title}</Text>
      <Text style={s.description}>{description}</Text>
      {actionLabel && onAction ? (
        <Pressable style={s.button} onPress={onAction}>
          <Text style={s.buttonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: "center",
  },
  title: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  description: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    color: colors.textMuted,
  },
  button: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.accent,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
});

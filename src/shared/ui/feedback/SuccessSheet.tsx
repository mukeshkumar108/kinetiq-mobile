import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { colors } from "@/shared/theme/colors";

interface SuccessSheetProps {
  emoji: string;
  title: string;
  subtitle: string;
  meta?: string;
}

export function SuccessSheet({ emoji, title, subtitle, meta }: SuccessSheetProps) {
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Everything appears together — emoji bounces, content fades in simultaneously
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        damping: 10,
        stiffness: 200,
        mass: 0.6,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[s.container, { opacity }]}>
      <Animated.Text style={[s.emoji, { transform: [{ scale }] }]}>
        {emoji}
      </Animated.Text>
      <Text style={s.title}>{title}</Text>
      <Text style={s.subtitle}>{subtitle}</Text>
      {meta ? <Text style={s.meta}>{meta}</Text> : null}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 40,
    gap: 12,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    textAlign: "center",
    paddingHorizontal: 12,
  },
  meta: {
    fontSize: 15,
    fontWeight: "700",
    color: "#57E6A8",
    textAlign: "center",
    marginTop: 4,
  },
});

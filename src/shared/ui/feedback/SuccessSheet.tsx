import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { colors } from "@/shared/theme/colors";

interface SuccessSheetProps {
  emoji: string;
  title: string;
  subtitle: string;
  meta?: string;
  points?: number;
}

export function SuccessSheet({
  emoji,
  title,
  subtitle,
  meta,
  points,
}: SuccessSheetProps) {
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(0.72)).current;
  const pulseOpacity = useRef(new Animated.Value(0)).current;
  const pointsTranslateY = useRef(new Animated.Value(8)).current;
  const pointsOpacity = useRef(new Animated.Value(0)).current;
  const pointsScale = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
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
      Animated.parallel([
        Animated.timing(pulseOpacity, {
          toValue: 0.22,
          duration: 140,
          useNativeDriver: true,
        }),
        Animated.spring(pulseScale, {
          toValue: 1,
          damping: 12,
          stiffness: 140,
          mass: 0.8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    if (points) {
      Animated.parallel([
        Animated.timing(pointsOpacity, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.spring(pointsTranslateY, {
          toValue: -26,
          damping: 14,
          stiffness: 180,
          mass: 0.68,
          useNativeDriver: true,
        }),
        Animated.spring(pointsScale, {
          toValue: 1.1,
          damping: 10,
          stiffness: 220,
          mass: 0.65,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [opacity, points, pointsOpacity, pointsScale, pointsTranslateY, pulseOpacity, pulseScale, scale]);

  return (
    <Animated.View style={[s.container, { opacity }]}>
      <View style={s.hero}>
        <Animated.View
          style={[
            s.pulse,
            {
              opacity: pulseOpacity,
              transform: [{ scale: pulseScale }],
            },
          ]}
        />
        <Animated.Text style={[s.emoji, { transform: [{ scale }] }]}>
          {emoji}
        </Animated.Text>
        {points ? (
          <Animated.View
            style={[
              s.pointsBurst,
              {
                opacity: pointsOpacity,
                transform: [
                  { translateY: pointsTranslateY },
                  { scale: pointsScale },
                ],
              },
            ]}
          >
            <Text style={s.pointsText}>+{points} XP</Text>
          </Animated.View>
        ) : null}
      </View>
      <Text style={s.title}>{title}</Text>
      <Text style={s.subtitle}>{subtitle}</Text>
      {meta ? <Text style={s.meta}>{meta}</Text> : null}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 20,
    gap: 10,
  },
  hero: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 96,
    minWidth: 160,
  },
  pulse: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(52, 198, 255, 0.14)",
  },
  emoji: {
    fontSize: 56,
    marginBottom: 4,
  },
  pointsBurst: {
    position: "absolute",
    top: 8,
    alignSelf: "center",
  },
  pointsText: {
    fontSize: 22,
    lineHeight: 24,
    fontWeight: "900",
    letterSpacing: 0.3,
    color: "#34C6FF",
    textShadowColor: "rgba(52, 198, 255, 0.45)",
    textShadowRadius: 12,
    textShadowOffset: { width: 0, height: 0 },
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
    paddingHorizontal: 16,
  },
  meta: {
    fontSize: 15,
    fontWeight: "700",
    color: "#57E6A8",
    textAlign: "center",
    marginTop: 4,
  },
});

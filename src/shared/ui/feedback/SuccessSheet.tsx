import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { color, font, space } from "@/shared/theme/tokens";

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
    paddingTop: space.md,
    paddingBottom: space.xl,
    gap: space.md,
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
    backgroundColor: color.cyanMuted,
  },
  emoji: {
    fontSize: 56,
    marginBottom: space.xs,
  },
  pointsBurst: {
    position: "absolute",
    top: space.sm,
    alignSelf: "center",
  },
  pointsText: {
    fontSize: 22,
    lineHeight: 24,
    fontWeight: "900",
    letterSpacing: 0.3,
    color: color.cyan,
    textShadowColor: "rgba(52, 198, 255, 0.45)",
    textShadowRadius: 12,
    textShadowOffset: { width: 0, height: 0 },
  },
  title: {
    ...font.headline,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    ...font.caption,
    textAlign: "center",
    paddingHorizontal: space.lg,
  },
  meta: {
    ...font.caption,
    fontWeight: "700",
    color: color.mint,
    textAlign: "center",
    marginTop: space.xs,
  },
});

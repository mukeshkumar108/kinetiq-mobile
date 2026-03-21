import { type ReactNode, useCallback, useRef } from "react";
import {
  Animated,
  Pressable,
  type StyleProp,
  type ViewStyle,
} from "react-native";

interface PressableScaleProps {
  scale?: number;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  hitSlop?: number;
  children: ReactNode;
}

/**
 * Drop-in Pressable replacement that gives immediate tactile
 * feedback — a subtle scale-down spring on press.
 */
export function PressableScale({
  scale = 0.97,
  style,
  disabled,
  children,
  ...rest
}: PressableScaleProps) {
  const anim = useRef(new Animated.Value(1)).current;

  const onPressIn = useCallback(() => {
    Animated.spring(anim, {
      toValue: scale,
      damping: 15,
      stiffness: 300,
      mass: 0.4,
      useNativeDriver: true,
    }).start();
  }, [anim, scale]);

  const onPressOut = useCallback(() => {
    Animated.spring(anim, {
      toValue: 1,
      damping: 12,
      stiffness: 200,
      mass: 0.4,
      useNativeDriver: true,
    }).start();
  }, [anim]);

  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      {...rest}
    >
      <Animated.View
        style={[
          style as StyleProp<ViewStyle>,
          {
            transform: [{ scale: anim }],
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

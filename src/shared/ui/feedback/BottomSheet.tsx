import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { color, font, space, radius } from "@/shared/theme/tokens";

const SCREEN_HEIGHT = Dimensions.get("window").height;

interface BottomSheetProps {
  visible: boolean;
  onDismiss: () => void;
  title?: string;
  children: ReactNode;
}

export function BottomSheet({
  visible,
  onDismiss,
  title,
  children,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const isAnimating = useRef(false);

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      isAnimating.current = true;
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(backdropOpacity, {
            toValue: 1,
            duration: 260,
            useNativeDriver: true,
          }),
          Animated.spring(sheetTranslateY, {
            toValue: 0,
            damping: 28,
            stiffness: 380,
            mass: 0.7,
            useNativeDriver: true,
          }),
        ]).start(() => {
          isAnimating.current = false;
        });
      });
    } else if (modalVisible) {
      animateOut(() => setModalVisible(false));
    }
  }, [visible]);

  const animateOut = (onComplete: () => void) => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(sheetTranslateY, {
        toValue: SCREEN_HEIGHT,
        damping: 20,
        stiffness: 200,
        mass: 0.9,
        useNativeDriver: true,
      }),
    ]).start(() => {
      isAnimating.current = false;
      onComplete();
    });
  };

  const handleDismiss = () => {
    animateOut(() => {
      setModalVisible(false);
      onDismiss();
    });
  };

  return (
    <Modal
      visible={modalVisible}
      animationType="none"
      transparent
      onRequestClose={handleDismiss}
    >
      <KeyboardAvoidingView
        style={s.keyboardWrap}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={s.overlay}>
          <Animated.View style={[s.backdrop, { opacity: backdropOpacity }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} />
          </Animated.View>
          <Animated.View
            style={[
              s.sheet,
              {
                paddingBottom: insets.bottom + space["3xl"],
                transform: [{ translateY: sheetTranslateY }],
              },
            ]}
          >
            <View style={s.handle} />
            {title ? (
              <View style={s.header}>
                <Text style={s.title}>{title}</Text>
                <Pressable onPress={handleDismiss} hitSlop={12} style={s.closeBtn}>
                  <Ionicons name="close" size={20} color={color.textSecondary} />
                </Pressable>
              </View>
            ) : (
              <View style={s.headerNoTitle}>
                <Pressable onPress={handleDismiss} hitSlop={12} style={s.closeBtn}>
                  <Ionicons name="close" size={20} color={color.textSecondary} />
                </Pressable>
              </View>
            )}
            <View style={s.body}>{children}</View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  keyboardWrap: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: color.overlay,
  },
  sheet: {
    backgroundColor: color.bgSheet,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: space["2xl"],
    minHeight: "42%",
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: color.border,
    alignSelf: "center",
    marginTop: space.md,
    marginBottom: space.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: space["2xl"],
  },
  headerNoTitle: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: space.sm,
  },
  title: {
    ...font.headline,
    fontWeight: "700",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.lg,
    backgroundColor: color.divider,
    justifyContent: "center",
    alignItems: "center",
  },
  body: {},
});

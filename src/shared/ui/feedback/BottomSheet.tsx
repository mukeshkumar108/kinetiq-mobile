import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  Animated,
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
import { colors } from "@/shared/theme/colors";

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
  const sheetTranslateY = useRef(new Animated.Value(500)).current;
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
            damping: 24,
            stiffness: 220,
            mass: 0.9,
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
      Animated.timing(sheetTranslateY, {
        toValue: 500,
        duration: 220,
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
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={s.overlay}>
          <Animated.View style={[s.backdrop, { opacity: backdropOpacity }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} />
          </Animated.View>
          <Animated.View
            style={[
              s.sheet,
              {
                paddingBottom: insets.bottom + 32,
                transform: [{ translateY: sheetTranslateY }],
              },
            ]}
          >
            <View style={s.handle} />
            {title ? (
              <View style={s.header}>
                <Text style={s.title}>{title}</Text>
                <Pressable onPress={handleDismiss} hitSlop={12} style={s.closeBtn}>
                  <Ionicons name="close" size={20} color={colors.textMuted} />
                </Pressable>
              </View>
            ) : (
              <View style={s.headerNoTitle}>
                <Pressable onPress={handleDismiss} hitSlop={12} style={s.closeBtn}>
                  <Ionicons name="close" size={20} color={colors.textMuted} />
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
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    backgroundColor: colors.tabBar,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    minHeight: "42%",
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerNoTitle: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  body: {},
});

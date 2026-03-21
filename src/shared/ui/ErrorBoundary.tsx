import { Component, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { color, font, space, radius } from "@/shared/theme/tokens";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("[ErrorBoundary]", error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={s.container}>
        <Text style={s.emoji}>⚡</Text>
        <Text style={s.title}>Something went wrong</Text>
        <Text style={s.body}>
          An unexpected error occurred. Tap below to restart the screen.
        </Text>
        <Pressable
          style={s.button}
          onPress={() => this.setState({ hasError: false })}
        >
          <Text style={s.buttonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: space["3xl"],
    gap: space.lg,
  },
  emoji: {
    fontSize: 48,
    marginBottom: space.sm,
  },
  title: {
    ...font.headline,
    fontWeight: "700",
    textAlign: "center",
  },
  body: {
    ...font.caption,
    textAlign: "center",
    lineHeight: 22,
  },
  button: {
    marginTop: space.md,
    paddingHorizontal: space["3xl"],
    paddingVertical: space.lg,
    borderRadius: radius.full,
    backgroundColor: color.mint,
  },
  buttonText: {
    ...font.body,
    fontWeight: "700",
    color: color.textInverse,
  },
});

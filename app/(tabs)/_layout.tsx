import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { color } from "@/shared/theme/tokens";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: color.bgSheet,
          borderTopColor: color.borderStrong,
          borderTopWidth: 0.5,
        },
        tabBarActiveTintColor: color.mint,
        tabBarInactiveTintColor: color.textTertiary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="manage"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

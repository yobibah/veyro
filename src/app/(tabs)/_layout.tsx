import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TabIcon } from "../../components/TabIcon";
import { colors } from "../../constants/theme";

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.inactive,
        tabBarLabelPosition: "below-icon",
        tabBarLabelStyle: { fontFamily: "Inter_400Regular", fontSize: 10, marginTop: 2 },
        tabBarStyle: {
          position: "absolute",
          left: insets.left,
          right: insets.right,
          bottom: 0,
          height: 70 + insets.bottom,
          paddingTop: 9,
          paddingBottom: Math.max(insets.bottom, 10),
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          borderTopWidth: 1,
          elevation: 8,
        },
        tabBarHideOnKeyboard: true,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color, size }) => <TabIcon name="home-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="apps"
        options={{
          title: "Applications",
          tabBarIcon: ({ color, size }) => <TabIcon name="apps-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => <TabIcon name="person-circle-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

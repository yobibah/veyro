import { useBottomTabBarHeight } from "expo-router/tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function useTabScreenPadding() {
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();

  return {
    paddingBottom: tabBarHeight + 16,
    paddingLeft: 20 + insets.left,
    paddingRight: 20 + insets.right,
  };
}

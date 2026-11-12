import { Ionicons } from "@expo/vector-icons";
import type { ColorValue } from "react-native";

type TabIconProps = {
  name: React.ComponentProps<typeof Ionicons>["name"];
  color: ColorValue;
  size: number;
};

export function TabIcon({ name, color, size }: TabIconProps) {
  return <Ionicons name={name} color={String(color)} size={size} />;
}

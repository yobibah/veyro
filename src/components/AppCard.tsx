import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { DistractionApp } from "../constants/apps";
import { colors } from "../constants/theme";

type AppCardProps = {
  app: DistractionApp;
  selected: boolean;
  disabled?: boolean;
  icon?: string;
  onToggle: () => void;
};

export function AppCard({ app, selected, disabled = false, icon, onToggle }: AppCardProps) {
  return (
    <Pressable
      onPress={onToggle}
      disabled={disabled || app.selectable === false}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled: disabled || app.selectable === false }}
    >
      {icon ? <Image source={{ uri: `data:image/png;base64,${icon}` }} style={styles.appIcon} /> : <View style={[styles.appIcon, { backgroundColor: app.color ?? colors.surfaceRaised }]}><Text style={styles.appInitials}>{app.name.slice(0, 2)}</Text></View>}
      <View style={styles.copy}>
        <Text style={styles.name}>{app.name}</Text>
        <Text style={styles.category}>{app.category}</Text>
      </View>
      <View style={[styles.checkbox, selected && styles.selected, app.selectable === false && styles.nonSelectable]}>
        {selected ? <Ionicons name="checkmark" size={17} color={colors.greenDark} /> : null}
        {(disabled || app.selectable === false) && !selected ? <Ionicons name="lock-closed" size={12} color={colors.muted} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 78, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 12 },
  pressed: { opacity: 0.75 },
  appIcon: { width: 48, height: 48, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  appInitials: { color: "white", fontFamily: "Inter_700Bold", fontSize: 16, textTransform: "capitalize" },
  darkInitials: { color: "white" },
  nonSelectable: { opacity: 0.6 },
  copy: { flex: 1, minWidth: 0 },
  name: { color: colors.ink, fontFamily: "Inter_700Bold", fontSize: 15 },
  category: { color: colors.muted, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 4 },
  checkbox: { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  selected: { backgroundColor: colors.greenSecondary, borderColor: colors.greenSecondary },
});

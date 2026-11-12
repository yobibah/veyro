import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/theme";

type CustomHeaderProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  action?: () => void;
};

export function CustomHeader({ title, subtitle, eyebrow, action }: CustomHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action ? (
        <Pressable onPress={action} style={styles.action} accessibilityRole="button" accessibilityLabel="Voir le profil et les statistiques">
          <Ionicons name="pulse-outline" color={colors.ink} size={23} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 74, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 },
  copy: { flex: 1, minWidth: 0 },
  eyebrow: { color: colors.muted, fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 7 },
  title: { color: colors.ink, fontFamily: "Inter_700Bold", fontSize: 27, letterSpacing: -0.6 },
  subtitle: { color: colors.muted, fontFamily: "Inter_400Regular", fontSize: 14, marginTop: 7 },
  action: { width: 52, height: 52, flexShrink: 0, borderWidth: 1, borderColor: colors.line, borderRadius: 26, backgroundColor: colors.surfaceRaised, alignItems: "center", justifyContent: "center" },
});

import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/theme";

type ProtectionCardProps = {
  active: boolean;
  appCount: number;
  onActivate: () => void;
};

export function ProtectionCard({ active, appCount, onActivate }: ProtectionCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, active && styles.activeIcon]}>
          <Ionicons name={active ? "leaf" : "leaf-outline"} size={22} color={active ? colors.greenSecondary : colors.muted} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>Concentration {active ? "active" : "inactive"}</Text>
          <Text style={styles.subtitle}>{appCount} application{appCount === 1 ? "" : "s"} sélectionnée{appCount === 1 ? "" : "s"}</Text>
        </View>
        <View style={[styles.pill, active ? styles.pillActive : styles.pillInactive]}>
          <View style={[styles.pillDot, active && styles.dotActive]} />
          <Text style={[styles.pillText, active && styles.pillTextActive]}>{active ? "Active" : "Inactive"}</Text>
        </View>
      </View>
      {active ? (
        <View style={styles.lockedBanner}>
          <Ionicons name="lock-closed" size={15} color={colors.greenSecondary} />
          <Text style={styles.lockedText}>Session Veyro verrouillée jusqu’à 17:00</Text>
        </View>
      ) : (
        <Pressable onPress={onActivate} disabled={appCount === 0} style={({ pressed }) => [styles.button, appCount === 0 && styles.buttonDisabled, pressed && styles.pressed]} accessibilityRole="button" accessibilityState={{ disabled: appCount === 0 }}>
          <Ionicons name={appCount === 0 ? "apps-outline" : "play"} size={16} color={colors.ink} />
          <Text style={styles.buttonText}>{appCount === 0 ? "Choisir des applications" : "Activer la concentration"}</Text>
        </Pressable>
      )}
      <View style={styles.unlockRow}>
        <Ionicons name="time-outline" size={16} color={colors.muted} />
        <Text style={styles.unlockText}>Fin prévue de la session</Text>
        <Text style={styles.unlockTime}>17:00</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 22, borderWidth: 1, borderColor: colors.line, padding: 17, gap: 15 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 11 },
  iconWrap: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.surfaceRaised, alignItems: "center", justifyContent: "center" },
  activeIcon: { backgroundColor: colors.greenSoft },
  copy: { flex: 1 },
  title: { color: colors.ink, fontFamily: "Inter_700Bold", fontSize: 14 },
  subtitle: { color: colors.muted, fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 4 },
  pill: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 6 },
  pillActive: { backgroundColor: colors.greenSoft },
  pillInactive: { backgroundColor: colors.surfaceRaised },
  pillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.inactive },
  dotActive: { backgroundColor: colors.green },
  pillText: { color: colors.muted, fontFamily: "Inter_700Bold", fontSize: 10 },
  pillTextActive: { color: colors.greenSecondary },
  button: { height: 48, borderRadius: 14, backgroundColor: colors.greenSecondary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  buttonText: { color: colors.greenDark, fontFamily: "Inter_700Bold", fontSize: 13 },
  buttonDisabled: { opacity: 0.5 },
  lockedBanner: { height: 48, borderRadius: 14, backgroundColor: colors.greenSoft, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  lockedText: { color: colors.greenSecondary, fontFamily: "Inter_700Bold", fontSize: 12 },
  pressed: { opacity: 0.83, transform: [{ scale: 0.99 }] },
  unlockRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  unlockText: { flex: 1, color: colors.muted, fontFamily: "Inter_400Regular", fontSize: 11 },
  unlockTime: { color: colors.ink, fontFamily: "Inter_700Bold", fontSize: 12 },
});

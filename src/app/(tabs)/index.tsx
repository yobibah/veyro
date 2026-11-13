import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Countdown } from "../../components/Countdown";
import { CustomHeader } from "../../components/CustomHeader";
import { ProtectionCard } from "../../components/ProtectionCard";
import { colors } from "../../constants/theme";
import { useProtection } from "../../hooks/use-protection";
import { useLocalDate } from "../../hooks/use-local-clock";
import { useTabScreenPadding } from "../../hooks/use-tab-screen-padding";
import { useInstalledApps } from "../../hooks/use-installed-apps";
import { focusModes } from "../../constants/focus-modes";

export default function HomeScreen() {
  const { isProtectionActive, startProtection, selectedAppIds, schedules, nativePermissions, focusMode, applyFocusMode } = useProtection();
  const { apps } = useInstalledApps();
  const contentInsets = useTabScreenPadding();
  const date = useLocalDate();
  const selectedApps = apps.filter((app) => selectedAppIds.includes(app.id));
  const currentSchedule = schedules[0];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, contentInsets]} showsVerticalScrollIndicator={false}>
      <CustomHeader title="Bonjour" eyebrow={date ?? " "} action={() => router.navigate("/profile")} />

      <View style={[styles.statusPill, isProtectionActive ? styles.statusPillActive : styles.statusPillInactive]}>
        <View style={[styles.statusDot, isProtectionActive && styles.statusDotActive]} />
        <Text style={[styles.statusText, isProtectionActive && styles.statusTextActive]}>
          {isProtectionActive ? "Concentration active" : "Concentration inactive"}
        </Text>
      </View>

      <View style={styles.modesSection}>
        <View style={styles.modesHeading}>
          <Text style={styles.modesTitle}>Modes rapides</Text>
          <Text style={styles.modesHint}>{isProtectionActive ? "Modifiable après la session" : "Choisissez un rythme"}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modesRow}>
          {focusModes.map((mode) => {
            const selected = focusMode === mode.id;
            const packageNames = apps.filter((app) => mode.categories.includes(app.category)).map((app) => app.packageName);
            return (
              <Pressable key={mode.id} onPress={() => applyFocusMode(mode.id, packageNames)} disabled={isProtectionActive} style={[styles.modeCard, selected && styles.modeCardSelected, isProtectionActive && styles.modeDisabled]} accessibilityRole="button" accessibilityState={{ selected, disabled: isProtectionActive }}>
                <View style={[styles.modeIcon, selected && styles.modeIconSelected]}><Ionicons name={mode.icon} size={18} color={selected ? "white" : colors.greenSecondary} /></View>
                <Text style={styles.modeName}>{mode.title}</Text>
                <Text style={styles.modeDescription}>{mode.description}</Text>
                <Text style={styles.modeAppCount}>{packageNames.length} applis ciblées</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <Countdown startTime={currentSchedule?.start} endTime={currentSchedule?.end} />

      <View style={styles.hoursCard}>
        <View style={styles.hourCell}>
          <Text style={styles.hourLabel}>Début du travail</Text>
          <Text style={styles.hourValue}>{currentSchedule?.start ?? "08:00"}</Text>
        </View>
        <View style={styles.hourDivider} />
        <View style={styles.hourCell}>
          <Text style={styles.hourLabel}>Fin du travail</Text>
          <Text style={styles.hourValue}>{currentSchedule?.end ?? "17:00"}</Text>
        </View>
      </View>

      <Pressable onPress={() => router.navigate("/apps")} style={({ pressed }) => [styles.appsCard, pressed && styles.pressed]}>
        <View style={styles.appsTop}>
          <View style={styles.appMarks}>
            {selectedApps.slice(0, 3).map((app, index) => (
              <View key={app.id} style={[styles.appMark, { backgroundColor: colors.surfaceRaised, marginLeft: index === 0 ? 0 : -10 }]}>{app.icon ? <Image source={{ uri: `data:image/png;base64,${app.icon}` }} style={styles.appMarkImage} /> : <Text style={styles.appMarkText}>{app.name.slice(0, 2)}</Text>}</View>
            ))}
          </View>
          <View style={styles.appsCopy}>
            <Text style={styles.appsCount}>{selectedAppIds.length} applications sélectionnées</Text>
            <Text numberOfLines={1} style={styles.appsNames}>
              {selectedApps.length ? selectedApps.map((app) => app.name).join(", ") : "Choisir des applications"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={21} color={colors.muted} />
        </View>
        <View style={styles.cardDivider} />
        <View style={styles.nextRow}>
          <View style={styles.iconTile}><Ionicons name="time-outline" size={22} color={colors.greenSecondary} /></View>
          <View style={styles.nextCopy}>
            <Text style={styles.nextLabel}>Fin prévue de la concentration</Text>
            <Text style={styles.nextTitle}>Aujourd’hui à {currentSchedule?.end ?? "17:00"}</Text>
          </View>
          <Text style={styles.nextTime}>{currentSchedule?.end ?? "17:00"}</Text>
        </View>
        <View style={styles.cardDivider} />
        <View style={styles.nextRow}>
          <View style={[styles.iconTile, styles.lockTile]}><Ionicons name={isProtectionActive ? "lock-closed-outline" : "lock-open-outline"} size={21} color={colors.greenSecondary} /></View>
          <View style={styles.nextCopy}>
            <Text style={styles.nextTitle}>Mode strict {isProtectionActive ? "activé" : "inactif"}</Text>
            <Text style={styles.nextLabel}>{isProtectionActive ? "Contrôles Veyro verrouillés jusqu’à 17:00" : "Votre sélection est prête pour une session"}</Text>
          </View>
          <Ionicons name={isProtectionActive ? "checkmark-circle" : "chevron-forward"} size={20} color={colors.greenSecondary} />
        </View>
      </Pressable>

      {!nativePermissions.accessibilityEnabled ? <Text style={styles.permissionHint}>Pour bloquer réellement les applications, activez d’abord le service Veyro dans les réglages d’accessibilité Android.</Text> : null}
      <ProtectionCard active={isProtectionActive} appCount={selectedAppIds.length} onActivate={startProtection} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingTop: 14, gap: 18 },
  statusPill: { alignSelf: "center", minHeight: 40, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, paddingHorizontal: 17, borderRadius: 22 },
  statusPillActive: { backgroundColor: colors.greenSoft },
  statusPillInactive: { backgroundColor: colors.surfaceRaised },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.muted },
  statusDotActive: { backgroundColor: colors.greenSecondary },
  statusText: { color: colors.muted, fontFamily: "Inter_700Bold", fontSize: 13 },
  statusTextActive: { color: colors.greenSecondary },
  modesSection: { gap: 10 },
  modesHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  modesTitle: { color: colors.ink, fontFamily: "Inter_700Bold", fontSize: 15 },
  modesHint: { color: colors.muted, fontFamily: "Inter_400Regular", fontSize: 10 },
  modesRow: { gap: 10, paddingRight: 4 },
  modeCard: { width: 160, minHeight: 128, padding: 12, borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, gap: 5 },
  modeCardSelected: { borderColor: colors.greenSecondary, backgroundColor: colors.greenSoft },
  modeDisabled: { opacity: 0.65 },
  modeIcon: { width: 32, height: 32, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: colors.greenSoft, marginBottom: 2 },
  modeIconSelected: { backgroundColor: colors.green },
  modeName: { color: colors.ink, fontFamily: "Inter_700Bold", fontSize: 13 },
  modeDescription: { color: colors.muted, fontFamily: "Inter_400Regular", fontSize: 10 },
  modeAppCount: { color: colors.greenDark, fontFamily: "Inter_700Bold", fontSize: 10, marginTop: 3 },
  hoursCard: { minHeight: 96, flexDirection: "row", borderWidth: 1, borderColor: colors.line, borderRadius: 20, backgroundColor: colors.surface, overflow: "hidden" },
  hourCell: { flex: 1, justifyContent: "center", paddingHorizontal: 17, paddingVertical: 14 },
  hourLabel: { color: colors.muted, fontFamily: "Inter_400Regular", fontSize: 12 },
  hourValue: { color: colors.ink, fontFamily: "Inter_700Bold", fontSize: 25, marginTop: 6 },
  hourDivider: { width: 1, alignSelf: "stretch", backgroundColor: colors.line },
  appsCard: { borderWidth: 1, borderColor: colors.line, borderRadius: 20, backgroundColor: colors.surface, overflow: "hidden" },
  appsTop: { minHeight: 80, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, gap: 12 },
  appMarks: { flexDirection: "row", alignItems: "center", minWidth: 76 },
  appMark: { width: 40, height: 40, borderRadius: 12, borderWidth: 2, borderColor: colors.surface, alignItems: "center", justifyContent: "center" },
  appMarkText: { color: "white", fontFamily: "Inter_700Bold", fontSize: 11 },
  appMarkImage: { width: 36, height: 36, borderRadius: 10 },
  appsCopy: { flex: 1, minWidth: 0 },
  appsCount: { color: colors.ink, fontFamily: "Inter_700Bold", fontSize: 14 },
  appsNames: { color: colors.muted, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 4 },
  cardDivider: { height: 1, backgroundColor: colors.line },
  nextRow: { minHeight: 77, flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 14, paddingVertical: 12 },
  iconTile: { width: 42, height: 42, borderRadius: 13, backgroundColor: colors.surfaceRaised, alignItems: "center", justifyContent: "center" },
  lockTile: { backgroundColor: colors.greenSoft },
  nextCopy: { flex: 1, minWidth: 0 },
  nextLabel: { color: colors.muted, fontFamily: "Inter_400Regular", fontSize: 12 },
  nextTitle: { color: colors.ink, fontFamily: "Inter_700Bold", fontSize: 14, marginTop: 4 },
  nextTime: { color: colors.greenSecondary, fontFamily: "Inter_700Bold", fontSize: 13 },
  pressed: { opacity: 0.8 },
  permissionHint: { color: colors.muted, fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 16, textAlign: "center", paddingHorizontal: 8 },
});

import { Ionicons } from "@expo/vector-icons";
import { AppState, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useEffect, useState } from "react";
import { CustomHeader } from "../../components/CustomHeader";
import { colors } from "../../constants/theme";
import { useProtection } from "../../hooks/use-protection";
import { useLocalDay } from "../../hooks/use-local-clock";
import { useTabScreenPadding } from "../../hooks/use-tab-screen-padding";
import { veyroAndroid } from "../../services/veyro-android";

const days = [
  { short: "L", label: "Lundi", key: "Lun" },
  { short: "M", label: "Mardi", key: "Mar" },
  { short: "M", label: "Mercredi", key: "Mer" },
  { short: "J", label: "Jeudi", key: "Jeu" },
  { short: "V", label: "Vendredi", key: "Ven" },
  { short: "S", label: "Samedi", key: "Sam" },
  { short: "D", label: "Dimanche", key: "Dim" },
];

export default function ProfileScreen() {
  const { isProtectionActive, workingDays, toggleWorkingDay, schedules, updateSchedule, addSchedule, removeSchedule, nativePermissions, focusStats } = useProtection();
  const contentInsets = useTabScreenPadding();
  const todayKey = useLocalDay();
  const [usage, setUsage] = useState<{ hasAccess: boolean; totalMilliseconds: number } | null>(null);
  const activeDays = days.filter(({ key }) => workingDays.includes(key));
  const plannedHours = Math.round(schedules.reduce((total, schedule) => {
    const [sh, sm] = schedule.start.split(":").map(Number);
    const [eh, em] = schedule.end.split(":").map(Number);
    const duration = (eh * 60 + em - sh * 60 - sm + 1440) % 1440;
    return total + duration * (schedule.enabled ? schedule.days.length : 0);
  }, 0) / 60);
  useEffect(() => {
    if (!veyroAndroid) return;
    const refresh = () => queueMicrotask(() => {
      try { setUsage(veyroAndroid?.getUsageSummary() ?? null); } catch { setUsage(null); }
    });
    refresh();
    const subscription = AppState.addEventListener("change", (state) => { if (state === "active") refresh(); });
    return () => subscription.remove();
  }, []);
  const usageMinutes = Math.floor((usage?.totalMilliseconds ?? 0) / 60_000);
  const maxWeekMinutes = Math.max(1, ...focusStats.weekMinutes);
  const todayFocusHours = Math.floor(focusStats.todayMinutes / 60);
  const todayFocusRemainder = String(focusStats.todayMinutes % 60).padStart(2, "0");
  const last7Days = focusStats.weekMinutes.map((minutes, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return { minutes, label: ["D", "L", "M", "M", "J", "V", "S"][date.getDay()] };
  });
  const usageLabel = usage ? `${Math.floor(usageMinutes / 60)} h ${String(usageMinutes % 60).padStart(2, "0")}` : "—";


  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, contentInsets]} showsVerticalScrollIndicator={false}>
      <CustomHeader title="Profil" subtitle="Horaires, rappels et progression" />

      <View style={styles.profileCard}>
        <View style={styles.avatar}><Ionicons name="person" size={21} color="white" /></View>
        <View style={styles.profileCopy}>
          <Text style={styles.profileName}>Mon profil</Text>
          <Text style={styles.profileSub}>Mon espace de concentration</Text>
        </View>
        <Ionicons name="person-circle-outline" size={24} color={colors.muted} />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Planning hebdomadaire</Text>
        <Text style={styles.sectionMeta}>{activeDays.length} jours actifs · {plannedHours} h / semaine</Text>
      </View>
      <View style={styles.weekCard}>
        <View style={styles.axis}>
          <Text style={styles.axisLabel}>08h</Text>
          <Text style={styles.axisLabel}>12h</Text>
          <Text style={styles.axisLabel}>17h</Text>
        </View>
        <View style={styles.weekBars}>
          {days.map(({ short, key }) => {
            const active = workingDays.includes(key);
            const locked = active && isProtectionActive && key === todayKey;
            return (
              <View key={key} style={styles.barColumn}>
                <View style={[styles.barTrack, !active && styles.barTrackOff]}>
                  {active ? <View style={[styles.barFill, key === todayKey && styles.barFillToday]} /> : null}
                </View>
                <Text style={[styles.barDay, key === todayKey && styles.barDayToday]}>{short}</Text>
                {locked ? <Ionicons name="lock-closed" size={10} color={colors.greenSecondary} style={styles.lockMark} /> : null}
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.focusStatsCard}>
        <View style={styles.focusStatsHeading}>
          <View>
            <Text style={styles.sectionTitle}>Mes sessions</Text>
            <Text style={styles.sectionMeta}>Historique enregistré sur cet appareil</Text>
          </View>
          <Ionicons name="trophy-outline" size={21} color={colors.greenSecondary} />
        </View>
        <View style={styles.focusMetrics}>
          <View style={styles.focusMetric}>
            <Text style={styles.focusMetricValue}>{focusStats.todaySessions}</Text>
            <Text style={styles.focusMetricLabel}>sessions terminées aujourd’hui</Text>
          </View>
          <View style={styles.focusMetricDivider} />
          <View style={styles.focusMetric}>
            <Text style={styles.focusMetricValue}>{todayFocusHours} h {todayFocusRemainder}</Text>
            <Text style={styles.focusMetricLabel}>concentré aujourd’hui</Text>
          </View>
        </View>
        <View style={styles.focusWeekBars}>
          {last7Days.map(({ minutes, label }, index) => (
            <View key={index} style={styles.focusDayColumn}>
              <View style={styles.focusBarTrack}>
                {minutes > 0 ? <View style={[styles.focusBarFill, { height: Math.max(4, (minutes / maxWeekMinutes) * 48) }]} /> : null}
              </View>
              <Text style={styles.focusDayLabel}>{label}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.focusStatsHint}>{focusStats.todaySessions > 0 ? "Bravo, votre progression se construit session après session." : "Terminez une session pour commencer votre suivi."}</Text>
      </View>

      <Text style={styles.sectionTitle}>Jours de travail</Text>
      <View style={styles.daysCard}>
        {days.map(({ label, key }, index) => {
          const active = workingDays.includes(key);
          const today = key === todayKey;
          const locked = today && isProtectionActive;
            return (
              <Pressable key={key} onPress={() => !locked && toggleWorkingDay(key)} disabled={locked} style={[styles.dayRow, index < days.length - 1 && styles.dayBorder]} accessibilityRole="switch" accessibilityState={{ checked: active, disabled: locked }} accessibilityLabel={`${label}${today ? ", aujourd’hui" : ""}`}>
              <View style={styles.dayCopy}>
                <View style={styles.dayTitleRow}>
                  <Text style={styles.dayTitle}>{label}</Text>
                  {today ? <Text style={styles.todayLabel}>Aujourd’hui</Text> : null}
                </View>
          <Text style={styles.dayHours}>{active ? schedules.map(({ start, end }) => `${start}–${end}`).join(" · ") : "Aucune session prévue"}</Text>
              </View>
              <View style={[styles.toggleTrack, active && styles.toggleTrackOn, locked && styles.toggleLocked]}>
                <View style={[styles.toggleThumb, active && styles.toggleThumbOn]} />
              </View>
              </Pressable>
          );
        })}
      </View>

      <View style={styles.scheduleEditor}>
        <View style={styles.scheduleEditorHeading}>
          <Text style={styles.sectionTitle}>Plages de concentration</Text>
          {!isProtectionActive && schedules.length < 4 ? <Pressable onPress={addSchedule} accessibilityRole="button"><Ionicons name="add-circle" size={25} color={colors.greenSecondary} /></Pressable> : null}
        </View>
        {schedules.map((schedule, index) => (
          <View key={`schedule-${index}`} style={styles.scheduleTimeRow}>
            <Text style={styles.scheduleNumber}>Session {index + 1}</Text>
            <TextInput value={schedule.start} onChangeText={(value) => updateSchedule(index, "start", value)} editable={!isProtectionActive} keyboardType="numbers-and-punctuation" maxLength={5} style={styles.timeInput} accessibilityLabel={`Début de la session ${index + 1}`} />
            <Text style={styles.timeDash}>–</Text>
            <TextInput value={schedule.end} onChangeText={(value) => updateSchedule(index, "end", value)} editable={!isProtectionActive} keyboardType="numbers-and-punctuation" maxLength={5} style={styles.timeInput} accessibilityLabel={`Fin de la session ${index + 1}`} />
            {!isProtectionActive && schedules.length > 1 ? <Pressable onPress={() => removeSchedule(index)} accessibilityRole="button" accessibilityLabel={`Supprimer la session ${index + 1}`}><Ionicons name="trash-outline" size={18} color={colors.muted} /></Pressable> : null}
          </View>
        ))}
        <Text style={styles.scheduleHint}>Format 24 h, jusqu’à 4 plages par jour actif. Les plages de nuit passent au jour suivant.</Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Statistiques d’utilisation</Text>
        <Text style={styles.sectionMeta}>Aujourd’hui</Text>
      </View>
      <View style={styles.statsCard}>
        <View style={styles.statsIcon}><Ionicons name="stats-chart-outline" size={20} color={colors.greenSecondary} /></View>
        <View style={styles.statsCopy}>
          <Text style={styles.statsTitle}>{usage?.hasAccess ? `${usageLabel} d’utilisation aujourd’hui` : "Temps d’écran non autorisé"}</Text>
          <Text style={styles.statsSub}>Temps cumulé des applications Android, distinct du temps de concentration Veyro.</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Notifications</Text>
      </View>
      <View style={styles.infoCard}>
        <Ionicons name="notifications-outline" size={19} color={colors.greenSecondary} />
        <Text style={styles.infoText}>Une notification persistante affiche le mode de concentration, les applications bloquées et le compte à rebours pendant chaque session active.</Text>
      </View>
      {veyroAndroid ? <View style={styles.permissionCard}>
        <View style={styles.permissionCopy}>
          <Text style={styles.statsTitle}>Autorisation de blocage</Text>
          <Text style={styles.statsSub}>{nativePermissions.accessibilityEnabled ? "Service Veyro activé" : "À activer pour afficher une pause sur les applications choisies pendant les plages définies."}</Text>
        </View>
        <Pressable onPress={() => veyroAndroid?.openAccessibilitySettings()} style={styles.permissionButton} accessibilityRole="button">
          <Text style={styles.permissionButtonText}>{nativePermissions.accessibilityEnabled ? "Paramètres" : "Configurer"}</Text>
        </Pressable>
      </View> : null}
      {veyroAndroid ? <View style={styles.permissionCard}>
        <View style={styles.permissionCopy}>
          <Text style={styles.statsTitle}>Statistiques de temps d’écran</Text>
          <Text style={styles.statsSub}>{nativePermissions.usageAccessEnabled ? "Accès aux données d’utilisation autorisé." : "Autorisez l’accès spécial Android pour afficher la durée d’utilisation."}</Text>
        </View>
        <Pressable onPress={() => veyroAndroid?.openUsageAccessSettings()} style={styles.permissionButton} accessibilityRole="button">
          <Text style={styles.permissionButtonText}>{nativePermissions.usageAccessEnabled ? "Paramètres" : "Autoriser"}</Text>
        </Pressable>
      </View> : null}
      <Text style={styles.about}>Veyro · Moins de distractions, plus de présence.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingTop: 18, gap: 15 },
  profileCard: { minHeight: 76, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 18, paddingHorizontal: 14 },
  avatar: { width: 46, height: 46, alignItems: "center", justifyContent: "center", borderRadius: 15, backgroundColor: colors.green },
  profileCopy: { flex: 1 },
  profileName: { color: colors.ink, fontFamily: "Inter_700Bold", fontSize: 15 },
  profileSub: { color: colors.muted, fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 4 },
  sectionHeader: { gap: 4, marginTop: 4 },
  sectionTitle: { color: colors.ink, fontFamily: "Inter_700Bold", fontSize: 16 },
  sectionMeta: { color: colors.muted, fontFamily: "Inter_400Regular", fontSize: 12 },
  weekCard: { minHeight: 172, flexDirection: "row", gap: 11, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 20, padding: 15 },
  axis: { height: 125, justifyContent: "space-between", paddingVertical: 1 },
  axisLabel: { color: colors.muted, fontFamily: "Inter_400Regular", fontSize: 10 },
  weekBars: { flex: 1, flexDirection: "row", justifyContent: "space-between", gap: 6 },
  focusStatsCard: { gap: 14, padding: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 20 },
  focusStatsHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  focusMetrics: { minHeight: 68, flexDirection: "row", alignItems: "center", borderRadius: 14, backgroundColor: colors.background },
  focusMetric: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 3 },
  focusMetricValue: { color: colors.ink, fontFamily: "Inter_700Bold", fontSize: 19 },
  focusMetricLabel: { color: colors.muted, fontFamily: "Inter_400Regular", fontSize: 9 },
  focusMetricDivider: { width: 1, height: 38, backgroundColor: colors.line },
  focusWeekBars: { height: 64, flexDirection: "row", justifyContent: "space-between", gap: 9 },
  focusDayColumn: { flex: 1, alignItems: "center", gap: 4 },
  focusBarTrack: { flex: 1, width: "100%", justifyContent: "flex-end", overflow: "hidden", borderRadius: 7, backgroundColor: colors.surfaceRaised },
  focusBarFill: { width: "100%", borderRadius: 7, backgroundColor: colors.greenSecondary },
  focusDayLabel: { color: colors.muted, fontFamily: "Inter_700Bold", fontSize: 9 },
  focusStatsHint: { color: colors.muted, fontFamily: "Inter_400Regular", fontSize: 10 },
  barColumn: { flex: 1, alignItems: "center", gap: 7 },
  barTrack: { height: 123, width: "100%", borderRadius: 11, backgroundColor: colors.surfaceRaised, justifyContent: "flex-start", paddingTop: 12 },
  barTrackOff: { borderWidth: 1, borderColor: colors.line, borderStyle: "dashed", backgroundColor: "transparent" },
  barFill: { height: 72, width: "100%", borderRadius: 9, backgroundColor: colors.green },
  barFillToday: { backgroundColor: colors.greenSecondary },
  barDay: { color: colors.muted, fontFamily: "Inter_700Bold", fontSize: 12 },
  barDayToday: { color: colors.greenSecondary },
  lockMark: { position: "absolute", bottom: 19 },
  daysCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 20, overflow: "hidden" },
  scheduleEditor: { gap: 10, padding: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 18 },
  scheduleEditorHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  scheduleTimeRow: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 9, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8 },
  scheduleNumber: { flex: 1, color: colors.muted, fontFamily: "Inter_400Regular", fontSize: 12 },
  timeInput: { width: 66, height: 38, textAlign: "center", color: colors.ink, backgroundColor: colors.background, borderRadius: 10, fontFamily: "Inter_700Bold", fontSize: 14 },
  timeDash: { color: colors.muted },
  scheduleHint: { color: colors.muted, fontFamily: "Inter_400Regular", fontSize: 10, lineHeight: 15 },
  dayRow: { minHeight: 72, flexDirection: "row", alignItems: "center", paddingHorizontal: 15 },
  dayBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
  dayCopy: { flex: 1 },
  dayTitleRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  dayTitle: { color: colors.ink, fontFamily: "Inter_700Bold", fontSize: 14 },
  todayLabel: { color: colors.greenSecondary, fontFamily: "Inter_700Bold", fontSize: 10 },
  dayHours: { color: colors.muted, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 4 },
  toggleTrack: { width: 44, height: 26, borderRadius: 14, backgroundColor: colors.line, justifyContent: "center", padding: 3 },
  toggleTrackOn: { backgroundColor: colors.greenSecondary, alignItems: "flex-end" },
  toggleLocked: { opacity: 0.55 },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.muted },
  toggleThumbOn: { backgroundColor: "white" },
  statsCard: { minHeight: 90, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 18, padding: 14 },
  statsIcon: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: colors.greenSoft },
  statsCopy: { flex: 1 },
  statsTitle: { color: colors.ink, fontFamily: "Inter_700Bold", fontSize: 12 },
  statsSub: { color: colors.muted, fontFamily: "Inter_400Regular", fontSize: 10, lineHeight: 15, marginTop: 4 },
  infoCard: { minHeight: 60, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 16, paddingHorizontal: 14 },
  infoText: { flex: 1, color: colors.muted, fontFamily: "Inter_400Regular", fontSize: 11 },
  permissionCard: { minHeight: 82, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 18 },
  permissionCopy: { flex: 1, gap: 5 },
  permissionButton: { paddingHorizontal: 13, paddingVertical: 9, backgroundColor: colors.green, borderRadius: 12 },
  permissionButtonText: { color: "white", fontFamily: "Inter_700Bold", fontSize: 11 },
  about: { textAlign: "center", color: colors.muted, fontFamily: "Inter_400Regular", fontSize: 10, paddingVertical: 6 },
});

import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { AppCard } from "../../components/AppCard";
import { CustomHeader } from "../../components/CustomHeader";
import { colors } from "../../constants/theme";
import { useProtection } from "../../hooks/use-protection";
import { useTabScreenPadding } from "../../hooks/use-tab-screen-padding";
import { useInstalledApps } from "../../hooks/use-installed-apps";
import { veyroAndroid } from "../../services/veyro-android";

const categories = ["Toutes", "Sélection", "Réseaux sociaux", "Vidéo", "Divertissement", "Communauté"];

export default function AppsScreen() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Toutes");
  const { isProtectionActive, selectedAppIds, toggleApp } = useProtection();
  const { apps, available, refresh } = useInstalledApps();
  const contentInsets = useTabScreenPadding();
  const filteredApps = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("fr");
    return apps.filter((app) =>
      (category === "Toutes" || (category === "Sélection" ? selectedAppIds.includes(app.id) : app.category === category)) &&
      app.name.toLocaleLowerCase("fr").includes(normalized),
    );
  }, [query, category, selectedAppIds, apps]);
  const selectedApps = apps.filter((app) => selectedAppIds.includes(app.id));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, contentInsets]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <CustomHeader title="Applications" subtitle={`${selectedAppIds.length} sélectionnée${selectedAppIds.length === 1 ? "" : "s"}`} />

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={21} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Rechercher une application"
          placeholderTextColor={colors.muted}
          style={styles.input}
          returnKeyType="search"
          accessibilityLabel="Rechercher une application"
        />
        {query.length > 0 ? <Text onPress={() => setQuery("")} style={styles.clear}>Effacer</Text> : null}
      </View>

      <Pressable onPress={() => setCategory("Sélection")} style={({ pressed }) => [styles.selectedCard, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Afficher les applications sélectionnées">
        <View style={styles.miniIcons}>
          {selectedApps.slice(0, 4).map((app, index) => (
            <View key={app.id} style={[styles.miniIcon, { backgroundColor: colors.surfaceRaised, marginLeft: index ? -9 : 0 }]}>
              {app.icon ? <Image source={{ uri: `data:image/png;base64,${app.icon}` }} style={styles.miniImage} /> : <Text style={styles.miniIconText}>{app.name.slice(0, 1)}</Text>}
            </View>
          ))}
        </View>
        <Text style={styles.selectedLabel}>Voir la sélection</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </Pressable>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
        {categories.map((item) => {
          const active = item === category;
          return (
            <Pressable key={item} onPress={() => setCategory(item)} style={[styles.categoryChip, active && styles.categoryChipActive]}>
              <Text style={[styles.categoryText, active && styles.categoryTextActive]}>{item}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.listHeadingRow}>
        <Text style={styles.listHeading}>APERÇU DES APPLICATIONS</Text>
        {isProtectionActive ? <Ionicons name="lock-closed" size={14} color={colors.greenSecondary} /> : null}
      </View>
      {isProtectionActive ? (
        <Text style={styles.lockedHint}>La sélection est verrouillée jusqu’à 17:00.</Text>
      ) : null}
      {filteredApps.length ? filteredApps.map((app) => (
        <AppCard key={app.id} app={app} icon={app.icon} selected={selectedAppIds.includes(app.id)} disabled={isProtectionActive} onToggle={() => toggleApp(app.id)} />
      )) : (
        <View style={styles.empty}>
          <Ionicons name="search-outline" size={24} color={colors.muted} />
          <Text style={styles.emptyText}>{apps.length ? "Aucune application trouvée" : "Aucune application détectée"}</Text>
        </View>
      )}
      {available && apps.length === 0 ? <Pressable onPress={refresh} style={styles.notice}><Ionicons name="refresh-outline" size={16} color={colors.greenSecondary} /><Text style={styles.noticeText}>Actualiser la liste des applications</Text></Pressable> : null}
      {!available ? <View style={styles.notice}><Ionicons name="information-circle-outline" size={16} color={colors.muted} /><Text style={styles.noticeText}>Le catalogue natif est disponible dans l’application Android installée, pas dans Expo Go.</Text></View> : null}
      {veyroAndroid ? <Pressable onPress={() => veyroAndroid?.openAccessibilitySettings()} style={styles.notice}><Ionicons name="shield-checkmark-outline" size={16} color={colors.greenSecondary} /><Text style={styles.noticeText}>Autoriser le service Veyro dans les paramètres d’accessibilité Android.</Text></Pressable> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingTop: 18, gap: 15 },
  searchBox: { minHeight: 54, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 19 },
  input: { flex: 1, color: colors.ink, fontFamily: "Inter_400Regular", fontSize: 15, paddingVertical: 12 },
  clear: { color: colors.greenSecondary, fontFamily: "Inter_700Bold", fontSize: 11 },
  selectedCard: { minHeight: 72, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 19 },
  pressed: { opacity: 0.8 },
  miniIcons: { flexDirection: "row", alignItems: "center", minWidth: 92 },
  miniIcon: { width: 37, height: 37, borderWidth: 2, borderColor: colors.surface, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  miniIconText: { color: "white", fontFamily: "Inter_700Bold", fontSize: 13 },
  miniImage: { width: 33, height: 33, borderRadius: 8 },
  selectedLabel: { flex: 1, color: colors.ink, fontFamily: "Inter_700Bold", fontSize: 14 },
  categories: { gap: 9, paddingRight: 20 },
  categoryChip: { minHeight: 40, paddingHorizontal: 17, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.line, borderRadius: 22 },
  categoryChipActive: { backgroundColor: colors.greenSecondary, borderColor: colors.greenSecondary },
  categoryText: { color: colors.muted, fontFamily: "Inter_700Bold", fontSize: 12 },
  categoryTextActive: { color: colors.background },
  listHeadingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 3 },
  listHeading: { color: colors.muted, fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 1 },
  lockedHint: { color: colors.greenSecondary, fontFamily: "Inter_400Regular", fontSize: 11, marginTop: -10 },
  empty: { minHeight: 150, alignItems: "center", justifyContent: "center", gap: 9 },
  emptyText: { color: colors.muted, fontFamily: "Inter_400Regular", fontSize: 12 },
  notice: { flexDirection: "row", alignItems: "flex-start", gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.line },
  noticeText: { flex: 1, color: colors.muted, fontFamily: "Inter_400Regular", fontSize: 10, lineHeight: 15 },
});

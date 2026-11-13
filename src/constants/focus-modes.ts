import type { NativeSchedule } from "../services/veyro-android";

export type FocusModeId = "work" | "study" | "sleep" | "custom";

export const focusModes: {
  id: Exclude<FocusModeId, "custom">;
  title: string;
  description: string;
  icon: "briefcase-outline" | "book-outline" | "moon-outline";
  schedule: NativeSchedule;
  categories: string[];
}[] = [
  {
    id: "work",
    title: "Travail",
    description: "08:00–17:00 · lun–ven",
    icon: "briefcase-outline",
    schedule: { start: "08:00", end: "17:00", days: [0, 1, 2, 3, 4], enabled: true },
    categories: ["Réseaux sociaux", "Vidéo", "Divertissement", "Communauté", "Jeux"],
  },
  {
    id: "study",
    title: "Étude",
    description: "18:00–21:00 · tous les jours",
    icon: "book-outline",
    schedule: { start: "18:00", end: "21:00", days: [0, 1, 2, 3, 4, 5, 6], enabled: true },
    categories: ["Réseaux sociaux", "Vidéo", "Divertissement", "Communauté", "Jeux"],
  },
  {
    id: "sleep",
    title: "Sommeil",
    description: "22:00–07:00 · tous les jours",
    icon: "moon-outline",
    schedule: { start: "22:00", end: "07:00", days: [0, 1, 2, 3, 4, 5, 6], enabled: true },
    categories: ["Réseaux sociaux", "Vidéo", "Divertissement", "Communauté", "Jeux"],
  },
];

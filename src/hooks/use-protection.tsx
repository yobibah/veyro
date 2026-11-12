import { AppState } from "react-native";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { veyroAndroid, type NativeSchedule } from "../services/veyro-android";

type ProtectionContextValue = {
  isProtectionActive: boolean;
  startProtection: () => void;
  selectedAppIds: string[];
  toggleApp: (id: string) => void;
  workingDays: string[];
  toggleWorkingDay: (day: string) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  nativePermissions: { accessibilityEnabled: boolean; usageAccessEnabled: boolean };
  schedules: NativeSchedule[];
  updateSchedule: (index: number, field: "start" | "end", value: string) => void;
  addSchedule: () => void;
  removeSchedule: (index: number) => void;
};

const dayKeys = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const defaultDays = [0, 1, 2, 3, 4];
const defaultSchedules: NativeSchedule[] = [{ start: "08:00", end: "17:00", days: defaultDays, enabled: true }];
const ProtectionContext = createContext<ProtectionContextValue | null>(null);

function isWithinSchedule(enabled: boolean, selected: string[], schedules: NativeSchedule[], date: Date) {
  if (!enabled || selected.length === 0) return false;
  const today = (date.getDay() + 6) % 7;
  const yesterday = (today + 6) % 7;
  const minute = date.getHours() * 60 + date.getMinutes();
  return schedules.some((schedule) => {
    if (!schedule.enabled || schedule.start === schedule.end) return false;
    const [sh, sm] = schedule.start.split(":").map(Number);
    const [eh, em] = schedule.end.split(":").map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    return start < end
      ? schedule.days.includes(today) && minute >= start && minute < end
      : (schedule.days.includes(today) && minute >= start) || (schedule.days.includes(yesterday) && minute < end);
  });
}

export function ProtectionProvider({ children }: PropsWithChildren) {
  const [enabled, setEnabled] = useState(false);
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);
  const [schedules, setSchedules] = useState<NativeSchedule[]>(defaultSchedules);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [now, setNow] = useState(() => new Date());
  const [nativePermissions, setNativePermissions] = useState({ accessibilityEnabled: false, usageAccessEnabled: false });
  const [hydrated, setHydrated] = useState(() => !veyroAndroid);

  useEffect(() => {
    const bridge = veyroAndroid;
    if (!bridge) return;
    queueMicrotask(() => {
      try {
        const nativeState = bridge.getState();
        setEnabled(nativeState.enabled);
        setSelectedAppIds(nativeState.selectedPackageNames);
        setSchedules(nativeState.schedules.length ? nativeState.schedules : defaultSchedules);
        setNativePermissions({ accessibilityEnabled: nativeState.accessibilityEnabled, usageAccessEnabled: nativeState.usageAccessEnabled });
      } catch { /* Expo Go has no Veyro native module. */ }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated || !veyroAndroid) return;
    void veyroAndroid.savePolicy(enabled, selectedAppIds, schedules);
  }, [hydrated, enabled, selectedAppIds, schedules]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const tick = () => { setNow(new Date()); timeout = setTimeout(tick, 30_000); };
    tick();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        setNow(new Date());
        if (veyroAndroid) {
          try {
            const nativeState = veyroAndroid.getState();
            setNativePermissions({ accessibilityEnabled: nativeState.accessibilityEnabled, usageAccessEnabled: nativeState.usageAccessEnabled });
          } catch { /* Native permission state is unavailable in Expo Go. */ }
        }
      }
    });
    return () => { clearTimeout(timeout); subscription.remove(); };
  }, []);

  const isProtectionActive = isWithinSchedule(enabled, selectedAppIds, schedules, now);
  const startProtection = useCallback(() => {
    if (veyroAndroid && !nativePermissions.accessibilityEnabled) {
      veyroAndroid.openAccessibilitySettings();
      return;
    }
    setEnabled(true);
  }, [nativePermissions.accessibilityEnabled]);
  const toggleApp = useCallback((id: string) => {
    if (isProtectionActive) return;
    setSelectedAppIds((current) => current.includes(id) ? current.filter((appId) => appId !== id) : [...current, id]);
  }, [isProtectionActive]);
  const workingDays = useMemo(() => schedules[0]?.days.map((day) => dayKeys[day]).filter(Boolean) ?? [], [schedules]);
  const toggleWorkingDay = useCallback((day: string) => {
    const dayIndex = dayKeys.indexOf(day);
    if (dayIndex < 0 || isProtectionActive) return;
    setSchedules((current) => {
      const base = current[0] ?? defaultSchedules[0];
      const days = base.days.includes(dayIndex) ? base.days.filter((item) => item !== dayIndex) : [...base.days, dayIndex].sort((a, b) => a - b);
      return current.map((schedule) => ({ ...schedule, days }));
    });
  }, [isProtectionActive]);
  const updateSchedule = useCallback((index: number, field: "start" | "end", value: string) => {
    if (isProtectionActive || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return;
    setSchedules((current) => current.map((schedule, i) => i === index ? { ...schedule, [field]: value } : schedule));
  }, [isProtectionActive]);
  const addSchedule = useCallback(() => {
    if (isProtectionActive || schedules.length >= 4) return;
    setSchedules((current) => [...current, { start: "18:00", end: "19:00", days: [...(current[0]?.days ?? defaultDays)], enabled: true }]);
  }, [isProtectionActive, schedules.length]);
  const removeSchedule = useCallback((index: number) => {
    if (isProtectionActive || schedules.length <= 1) return;
    setSchedules((current) => current.filter((_, i) => i !== index));
  }, [isProtectionActive, schedules.length]);

  const value = useMemo<ProtectionContextValue>(() => ({
    isProtectionActive,
    startProtection,
    selectedAppIds,
    toggleApp,
    workingDays,
    toggleWorkingDay,
    notificationsEnabled,
    setNotificationsEnabled,
    nativePermissions,
    schedules,
    updateSchedule,
    addSchedule,
    removeSchedule,
  }), [isProtectionActive, startProtection, selectedAppIds, toggleApp, workingDays, toggleWorkingDay, notificationsEnabled, nativePermissions, schedules, updateSchedule, addSchedule, removeSchedule]);

  return <ProtectionContext.Provider value={value}>{children}</ProtectionContext.Provider>;
}

export function useProtection() {
  const context = useContext(ProtectionContext);
  if (!context) throw new Error("useProtection doit être utilisé dans ProtectionProvider.");
  return context;
}

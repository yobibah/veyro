import { requireOptionalNativeModule } from "expo";
import { Platform } from "react-native";

export type NativeVeyroApp = {
  id: string;
  packageName: string;
  name: string;
  category: string;
  system: boolean;
  selectable: boolean;
  selected: boolean;
  icon: string;
};

export type NativeSchedule = { start: string; end: string; days: number[]; enabled: boolean };
export type NativeVeyroState = {
  enabled: boolean;
  selectedPackageNames: string[];
  schedules: NativeSchedule[];
  accessibilityEnabled: boolean;
  usageAccessEnabled: boolean;
};

type VeyroAndroidBridge = {
  getInstalledApps(): NativeVeyroApp[];
  getState(): NativeVeyroState;
  savePolicy(enabled: boolean, packages: string[], schedules: NativeSchedule[]): Promise<void>;
  openAccessibilitySettings(): void;
  openUsageAccessSettings(): void;
  hasAccessibilityPermission(): boolean;
  getUsageSummary(): { hasAccess: boolean; totalMilliseconds: number };
};

export const veyroAndroid = Platform.OS === "android"
  ? requireOptionalNativeModule<VeyroAndroidBridge>("VeyroAndroid")
  : null;

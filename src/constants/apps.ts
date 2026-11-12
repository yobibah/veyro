export type DistractionApp = {
  id: string;
  name: string;
  category: string;
  color?: string;
  icon?: string;
  selectable?: boolean;
  packageName?: string;
};

// The installed application catalogue is provided by the Android PackageManager bridge.
export const appCatalog: DistractionApp[] = [];

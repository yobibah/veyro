import { useCallback, useEffect, useState } from "react";
import type { NativeVeyroApp } from "../services/veyro-android";
import { veyroAndroid } from "../services/veyro-android";

export function useInstalledApps() {
  const [apps, setApps] = useState<NativeVeyroApp[]>([]);
  const [available, setAvailable] = useState(false);
  const refresh = useCallback(() => {
    if (!veyroAndroid) return;
    try {
      setApps(veyroAndroid.getInstalledApps());
      setAvailable(true);
    } catch {
      setAvailable(false);
    }
  }, []);
  useEffect(() => {
    queueMicrotask(refresh);
  }, [refresh]);
  return { apps, available, refresh };
}

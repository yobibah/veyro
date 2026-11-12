import { useSyncExternalStore } from "react";

type Listener = () => void;

function createTicker(intervalMs: number) {
  const listeners = new Set<Listener>();
  let timer: ReturnType<typeof setInterval> | null = null;

  return (listener: Listener) => {
    listeners.add(listener);
    if (!timer) {
      timer = setInterval(() => listeners.forEach((notify) => notify()), intervalMs);
    }
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0 && timer) {
        clearInterval(timer);
        timer = null;
      }
    };
  };
}

const subscribeSeconds = createTicker(1000);
const subscribeMinutes = createTicker(60_000);
const getCurrentSecond = () => Math.floor(Date.now() / 1000);
const getCurrentDay = () => ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"][new Date().getDay()];
const getCurrentDate = () => new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

export function useLocalSecond() {
  return useSyncExternalStore(subscribeSeconds, getCurrentSecond, () => null);
}

export function useLocalDay() {
  return useSyncExternalStore(subscribeMinutes, getCurrentDay, () => null);
}

export function useLocalDate() {
  return useSyncExternalStore(subscribeMinutes, getCurrentDate, () => null);
}

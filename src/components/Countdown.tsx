import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors } from "../constants/theme";
import { useLocalSecond } from "../hooks/use-local-clock";

const STROKE = 12;

function getTimeLeft(now: Date, endTime: string) {
  const unlock = new Date(now);
  const [hours, minutes] = endTime.split(":").map(Number);
  unlock.setHours(hours || 0, minutes || 0, 0, 0);
  return Math.max(0, Math.ceil((unlock.getTime() - now.getTime()) / 1000));
}

function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours} h ${String(minutes).padStart(2, "0")}`;
}

export function Countdown({ startTime = "08:00", endTime = "17:00" }: { startTime?: string; endTime?: string }) {
  const currentSecond = useLocalSecond();
  const now = currentSecond === null ? null : new Date(currentSecond * 1000);

  const size = 250;
  const radius = (size - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const secondsLeft = now ? getTimeLeft(now, endTime) : 0;
  const startOfFocus = new Date(now ?? 0);
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  startOfFocus.setHours(startHour || 0, startMinute || 0, 0, 0);
  const focusDuration = ((endHour * 60 + endMinute - startHour * 60 - startMinute + 1440) % 1440) * 60;
  const elapsed = now ? (now.getTime() - startOfFocus.getTime()) / 1000 : 0;
  const progress = now ? Math.max(0, Math.min(1, elapsed / focusDuration)) : 0;
  const offset = circumference * (1 - progress);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.line} strokeWidth={STROKE} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.greenSecondary}
          strokeWidth={STROKE}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={styles.time}>{!now ? "-- h --" : secondsLeft > 0 ? formatTime(secondsLeft) : endTime}</Text>
        <Text style={styles.remaining}>{!now ? " " : secondsLeft > 0 ? "restantes" : "fin de session"}</Text>
        <Text style={styles.progress}>{Math.round(progress * 100)} % accompli</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", alignSelf: "center" },
  center: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center" },
  time: { color: colors.ink, fontFamily: "Inter_700Bold", fontSize: 43, letterSpacing: -1.4 },
  remaining: { color: colors.muted, fontFamily: "Inter_400Regular", fontSize: 14, marginTop: 2 },
  progress: { color: colors.greenSecondary, fontFamily: "Inter_700Bold", fontSize: 14, marginTop: 22 },
});

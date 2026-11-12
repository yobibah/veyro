package expo.modules.veyroandroid

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar

internal object VeyroPolicy {
  private const val PREFS = "veyro_protection"
  private const val SELECTED = "selected_packages"
  private const val SCHEDULES = "schedules"
  private const val ENABLED = "enabled"

  fun preferences(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
  fun selected(context: Context): Set<String> = preferences(context).getStringSet(SELECTED, emptySet())?.toSet() ?: emptySet()
  fun schedules(context: Context): JSONArray = try { JSONArray(preferences(context).getString(SCHEDULES, "[]")) } catch (_: Exception) { JSONArray() }
  fun enabled(context: Context) = preferences(context).getBoolean(ENABLED, false)

  fun save(context: Context, enabled: Boolean, packages: List<String>, schedules: List<Map<String, Any?>>) {
    val encodedSchedules = JSONArray()
    schedules.forEach { schedule ->
      val days = JSONArray()
      (schedule["days"] as? List<*>)?.forEach { days.put((it as? Number)?.toInt() ?: -1) }
      encodedSchedules.put(JSONObject().put("start", schedule["start"] as? String ?: "08:00")
        .put("end", schedule["end"] as? String ?: "17:00")
        .put("days", days)
        .put("enabled", schedule["enabled"] as? Boolean ?: true))
    }
    preferences(context).edit().putBoolean(ENABLED, enabled)
      .putStringSet(SELECTED, packages.toSet()).putString(SCHEDULES, encodedSchedules.toString()).apply()
  }

  fun isLocked(context: Context, now: Calendar = Calendar.getInstance()): Boolean {
    if (!enabled(context) || selected(context).isEmpty()) return false
    val minuteNow = now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE)
    val today = (now.get(Calendar.DAY_OF_WEEK) + 5) % 7 // Monday = 0
    val yesterday = (today + 6) % 7
    val schedules = schedules(context)
    for (index in 0 until schedules.length()) {
      val schedule = schedules.optJSONObject(index) ?: continue
      if (!schedule.optBoolean("enabled", true)) continue
      val start = parseMinute(schedule.optString("start")) ?: continue
      val end = parseMinute(schedule.optString("end")) ?: continue
      if (start == end) continue
      val days = schedule.optJSONArray("days") ?: continue
      val todayActive = containsDay(days, today)
      if (start < end && todayActive && minuteNow >= start && minuteNow < end) return true
      if (start > end && ((todayActive && minuteNow >= start) || (containsDay(days, yesterday) && minuteNow < end))) return true
    }
    return false
  }

  private fun containsDay(days: JSONArray, day: Int): Boolean = (0 until days.length()).any { days.optInt(it, -1) == day }
  private fun parseMinute(value: String): Int? = try {
    val parts = value.split(":")
    val h = parts[0].toInt(); val m = parts[1].toInt()
    if (h in 0..23 && m in 0..59) h * 60 + m else null
  } catch (_: Exception) { null }
}

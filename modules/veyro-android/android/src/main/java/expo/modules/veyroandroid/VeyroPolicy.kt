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
  private const val MODE = "focus_mode"
  private const val SESSION_STARTED = "focus_session_started"
  private const val SESSION_END = "focus_session_end"
  private const val SESSION_HISTORY = "focus_session_history"

  fun preferences(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
  fun selected(context: Context): Set<String> = preferences(context).getStringSet(SELECTED, emptySet())?.toSet() ?: emptySet()
  fun schedules(context: Context): JSONArray = try { JSONArray(preferences(context).getString(SCHEDULES, "[]")) } catch (_: Exception) { JSONArray() }
  fun enabled(context: Context) = preferences(context).getBoolean(ENABLED, false)
  fun mode(context: Context) = preferences(context).getString(MODE, "custom") ?: "custom"

  fun save(context: Context, enabled: Boolean, packages: List<String>, schedules: List<Map<String, Any?>>, mode: String) {
    val encodedSchedules = JSONArray()
    schedules.forEach { schedule ->
      val days = JSONArray()
      (schedule["days"] as? List<*>)?.forEach { days.put((it as? Number)?.toInt() ?: -1) }
      encodedSchedules.put(JSONObject().put("start", schedule["start"] as? String ?: "08:00")
        .put("end", schedule["end"] as? String ?: "17:00")
        .put("days", days)
        .put("enabled", schedule["enabled"] as? Boolean ?: true))
    }
    // Persist the policy outside the cache, and flush it before service synchronization.
    preferences(context).edit().putBoolean(ENABLED, enabled)
      .putStringSet(SELECTED, packages.toSet()).putString(SCHEDULES, encodedSchedules.toString())
      .putString(MODE, mode).commit()
  }

  /** Keeps session history in app-private preferences, independent of cache clearing. */
  fun updateFocusSession(context: Context, endMillis: Long?) {
    val prefs = preferences(context)
    val started = prefs.getLong(SESSION_STARTED, 0L)
    if (endMillis != null) {
      if (started == 0L) {
        prefs.edit().putLong(SESSION_STARTED, System.currentTimeMillis()).putLong(SESSION_END, endMillis).commit()
      } else prefs.edit().putLong(SESSION_END, endMillis).commit()
      return
    }
    if (started == 0L) return
    val plannedEnd = prefs.getLong(SESSION_END, 0L)
    val now = System.currentTimeMillis()
    if (plannedEnd > 0L && now >= plannedEnd) {
      val history = try { JSONArray(prefs.getString(SESSION_HISTORY, "[]")) } catch (_: Exception) { JSONArray() }
      history.put(JSONObject().put("completedAt", now).put("duration", (now - started).coerceAtLeast(0L)))
      while (history.length() > 90) history.remove(0)
      prefs.edit().putString(SESSION_HISTORY, history.toString()).remove(SESSION_STARTED).remove(SESSION_END).commit()
    } else prefs.edit().remove(SESSION_STARTED).remove(SESSION_END).commit()
  }

  fun focusStats(context: Context, nowMillis: Long = System.currentTimeMillis()): Map<String, Any> {
    val history = try { JSONArray(preferences(context).getString(SESSION_HISTORY, "[]")) } catch (_: Exception) { JSONArray() }
    val today = Calendar.getInstance().apply { timeInMillis = nowMillis; set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 0); set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0) }
    val dayStarts = (0..6).map { offset -> (today.clone() as Calendar).apply { add(Calendar.DAY_OF_YEAR, -offset) }.timeInMillis }
    val minutes = IntArray(7)
    var todaySessions = 0
    for (index in 0 until history.length()) {
      val session = history.optJSONObject(index) ?: continue
      val completedAt = session.optLong("completedAt", 0L)
      val durationMinutes = (session.optLong("duration", 0L) / 60_000L).toInt()
      if (completedAt >= dayStarts[0]) todaySessions++
      for (offset in 0..6) if (completedAt >= dayStarts[offset]) { minutes[6 - offset] += durationMinutes; break }
    }
    return mapOf("todaySessions" to todaySessions, "todayMinutes" to minutes[6], "weekMinutes" to minutes.toList())
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

  fun activeEndMillis(context: Context, now: Calendar = Calendar.getInstance()): Long? {
    if (!enabled(context) || selected(context).isEmpty()) return null
    val minuteNow = now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE)
    val today = (now.get(Calendar.DAY_OF_WEEK) + 5) % 7
    val yesterday = (today + 6) % 7
    val entries = schedules(context)
    for (index in 0 until entries.length()) {
      val item = entries.optJSONObject(index) ?: continue
      if (!item.optBoolean("enabled", true)) continue
      val start = parseMinute(item.optString("start")) ?: continue
      val end = parseMinute(item.optString("end")) ?: continue
      if (start == end) continue
      val days = item.optJSONArray("days") ?: continue
      val todayActive = containsDay(days, today)
      val active = if (start < end) todayActive && minuteNow >= start && minuteNow < end
        else (todayActive && minuteNow >= start) || (containsDay(days, yesterday) && minuteNow < end)
      if (!active) continue
      val endCalendar = (now.clone() as Calendar).apply {
        set(Calendar.HOUR_OF_DAY, end / 60); set(Calendar.MINUTE, end % 60); set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0)
        if (start > end && todayActive && minuteNow >= start) add(Calendar.DAY_OF_YEAR, 1)
      }
      return endCalendar.timeInMillis
    }
    return null
  }

  private fun containsDay(days: JSONArray, day: Int): Boolean = (0 until days.length()).any { days.optInt(it, -1) == day }
  private fun parseMinute(value: String): Int? = try {
    val parts = value.split(":")
    val h = parts[0].toInt(); val m = parts[1].toInt()
    if (h in 0..23 && m in 0..59) h * 60 + m else null
  } catch (_: Exception) { null }
}

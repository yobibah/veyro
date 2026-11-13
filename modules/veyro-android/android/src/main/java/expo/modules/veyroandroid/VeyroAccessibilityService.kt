package expo.modules.veyroandroid

import android.accessibilityservice.AccessibilityService
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.WindowManager
import android.view.accessibility.AccessibilityEvent
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import java.util.Calendar

class VeyroAccessibilityService : AccessibilityService() {
  private val handler = Handler(Looper.getMainLooper())
  private var windowManager: WindowManager? = null
  private var blocker: FrameLayout? = null
  private var blockedPackage: String? = null
  private var countdown: TextView? = null

  override fun onServiceConnected() {
    super.onServiceConnected()
    instance = this
    windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
    refreshIfRunning()
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    val target = event?.packageName?.toString() ?: return
    if (target == packageName) return
    if (VeyroPolicy.isLocked(this) && VeyroPolicy.selected(this).contains(target)) showBlocker(target)
    // Ignore unrelated window-list changes (status bar, dialogs, etc.). Only
    // dismiss the shield when Android reports an actual foreground-window change.
    else if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED && blocker != null) removeBlocker()
  }

  // An accessibility interruption is transient and must not expose the blocked app.
  override fun onInterrupt() { refreshIfRunning() }

  override fun onDestroy() {
    removeBlocker()
    if (instance === this) instance = null
    super.onDestroy()
  }

  private fun showBlocker(targetPackage: String) {
    blockedPackage = targetPackage
    if (blocker == null) {
      val root = FrameLayout(this).apply {
        setBackgroundColor(Color.rgb(10, 30, 39))
        isClickable = true
        isFocusable = true
        // Consume the complete touch sequence so taps and gestures never reach
        // controls in the temporarily blocked application underneath.
        setOnTouchListener { _, _ -> true }
      }
      val content = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        gravity = Gravity.CENTER
        setPadding(dp(32), dp(40), dp(32), dp(40))
      }
      val brand = text("VEYRO", 16, Color.rgb(75, 222, 190), true)
      val title = text("Cette application est en pause", 27, Color.WHITE, true)
      title.gravity = Gravity.CENTER
      val body = text("Reprenez votre activité à la fin de votre session de concentration.", 16, Color.rgb(176, 197, 205), false)
      body.gravity = Gravity.CENTER
      body.setPadding(0, dp(14), 0, dp(24))
      val timer = text("", 22, Color.rgb(75, 222, 190), true)
      timer.gravity = Gravity.CENTER
      countdown = timer
      content.addView(brand)
      content.addView(title, LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(26) })
      content.addView(body)
      content.addView(timer)
      root.addView(content, FrameLayout.LayoutParams(-1, -1))
      blocker = root
      try {
        windowManager?.addView(root, WindowManager.LayoutParams(
          WindowManager.LayoutParams.MATCH_PARENT,
          WindowManager.LayoutParams.MATCH_PARENT,
          WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
          WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
          PixelFormat.TRANSLUCENT,
        ))
      } catch (_: Exception) { blocker = null; return }
    }
    updateCountdown()
  }

  private fun updateCountdown() {
    if (blocker == null) return
    if (!VeyroPolicy.isLocked(this) || blockedPackage !in VeyroPolicy.selected(this)) {
      removeBlocker()
      return
    }
    val now = Calendar.getInstance()
    val schedules = VeyroPolicy.schedules(this)
    var minutes = 0
    val day = (now.get(Calendar.DAY_OF_WEEK) + 5) % 7
    val previousDay = (day + 6) % 7
    val minuteNow = now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE)
    for (i in 0 until schedules.length()) {
      val schedule = schedules.optJSONObject(i) ?: continue
      if (!schedule.optBoolean("enabled", true)) continue
      val start = schedule.optString("start").split(":").mapNotNull { it.toIntOrNull() }
      val end = schedule.optString("end").split(":").mapNotNull { it.toIntOrNull() }
      if (start.size != 2 || end.size != 2) continue
      val startMinute = start[0] * 60 + start[1]; val endMinute = end[0] * 60 + end[1]
      val days = schedule.optJSONArray("days") ?: continue
      val today = (0 until days.length()).any { days.optInt(it) == day }
      val yesterday = (0 until days.length()).any { days.optInt(it) == previousDay }
      if (startMinute < endMinute && today && minuteNow < endMinute) minutes = endMinute - minuteNow
      if (startMinute > endMinute && today && minuteNow >= startMinute) minutes = 1440 - minuteNow + endMinute
      if (startMinute > endMinute && yesterday && minuteNow < endMinute) minutes = endMinute - minuteNow
      if (minutes > 0) break
    }
    if (minutes <= 0) { removeBlocker(); return }
    countdown?.text = "Déblocage dans ${minutes / 60} h ${"%02d".format(minutes % 60)}"
    handler.removeCallbacks(tick)
    handler.postDelayed(tick, 30_000L)
  }

  private val tick = Runnable { updateCountdown() }

  private fun removeBlocker() {
    handler.removeCallbacks(tick)
    blocker?.let { try { windowManager?.removeView(it) } catch (_: Exception) {} }
    blocker = null
    countdown = null
    blockedPackage = null
  }

  private fun text(value: String, size: Int, color: Int, bold: Boolean) = TextView(this).apply {
    text = value
    textSize = size.toFloat()
    setTextColor(color)
    typeface = if (bold) Typeface.create("sans-serif", Typeface.BOLD) else Typeface.create("sans-serif", Typeface.NORMAL)
    gravity = Gravity.CENTER
  }

  private fun dp(value: Int) = (value * resources.displayMetrics.density).toInt()

  companion object {
    @Volatile private var instance: VeyroAccessibilityService? = null
    fun refreshIfRunning() { instance?.handler?.post { instance?.updateCountdown() } }
  }

  init { instance = this }
}

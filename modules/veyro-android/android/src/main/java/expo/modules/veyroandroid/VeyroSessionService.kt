package expo.modules.veyroandroid

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.UserManager
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class VeyroSessionService : Service() {
  private val handler = Handler(Looper.getMainLooper())
  private val refresh = object : Runnable {
    override fun run() {
      val end = VeyroPolicy.activeEndMillis(this@VeyroSessionService)
      VeyroPolicy.updateFocusSession(this@VeyroSessionService, end)
      if (end == null) {
        applyOwnerProtection(this@VeyroSessionService, false)
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
        return
      }
      applyOwnerProtection(this@VeyroSessionService, true)
      val notification = buildNotification(end)
      if (Build.VERSION.SDK_INT >= 34) startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
      else startForeground(NOTIFICATION_ID, notification)
      handler.postDelayed(this, (end - System.currentTimeMillis()).coerceAtLeast(1L))
    }
  }

  override fun onCreate() {
    super.onCreate()
    createNotificationChannel()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    handler.removeCallbacks(refresh)
    handler.post(refresh)
    return START_STICKY
  }

  override fun onDestroy() {
    handler.removeCallbacks(refresh)
    if (VeyroPolicy.activeEndMillis(this) == null) applyOwnerProtection(this, false)
    super.onDestroy()
  }

  override fun onBind(intent: Intent?): IBinder? = null

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT < 26) return
    val manager = getSystemService(NotificationManager::class.java)
    manager.createNotificationChannel(NotificationChannel(CHANNEL_ID, "Veyro · Concentration", NotificationManager.IMPORTANCE_LOW).apply {
      description = "Session de concentration active et compte à rebours de Veyro"
      setShowBadge(false)
    })
  }

  private fun buildNotification(endMillis: Long): Notification {
    val count = VeyroPolicy.selected(this).size
    val ending = SimpleDateFormat("HH'h'mm", Locale.getDefault()).format(Date(endMillis))
    val builder = if (Build.VERSION.SDK_INT >= 26) Notification.Builder(this, CHANNEL_ID) else Notification.Builder(this)
    builder.setSmallIcon(android.R.drawable.ic_lock_idle_lock)
      .setContentTitle("Veyro · Concentration activée")
      .setContentText("$count application${if (count == 1) "" else "s"} bloquée${if (count == 1) "" else "s"} · fin à $ending")
      .setSubText("Session de concentration en cours")
      .setWhen(endMillis)
      .setShowWhen(true)
      .setUsesChronometer(true)
      .setChronometerCountDown(true)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setCategory(Notification.CATEGORY_SERVICE)
      .setPriority(Notification.PRIORITY_LOW)
    return builder.build()
  }

  companion object {
    private const val CHANNEL_ID = "veyro_focus_session"
    private const val NOTIFICATION_ID = 7317

    fun applyOwnerProtection(context: Context, active: Boolean) {
      val dpm = context.getSystemService(DevicePolicyManager::class.java) ?: return
      if (!dpm.isDeviceOwnerApp(context.packageName)) return
      val admin = ComponentName(context, VeyroDeviceAdminReceiver::class.java)
      try {
        dpm.setUninstallBlocked(admin, context.packageName, active)
        if (active) dpm.addUserRestriction(admin, UserManager.DISALLOW_APPS_CONTROL)
        else dpm.clearUserRestriction(admin, UserManager.DISALLOW_APPS_CONTROL)
      } catch (_: SecurityException) {
        // A regular installation cannot impose device-wide restrictions.
      }
    }

    fun sync(context: Context) {
      val intent = Intent(context, VeyroSessionService::class.java)
      val endMillis = VeyroPolicy.activeEndMillis(context)
      val active = endMillis != null
      VeyroPolicy.updateFocusSession(context, endMillis)
      applyOwnerProtection(context, active)
      if (!active) {
        try { context.stopService(intent) } catch (_: Exception) {}
        return
      }
      try {
        if (Build.VERSION.SDK_INT >= 26) context.startForegroundService(intent) else context.startService(intent)
      } catch (_: Exception) {
        // The next app launch can restore the service if the OS disallows a background start.
      }
    }
  }
}

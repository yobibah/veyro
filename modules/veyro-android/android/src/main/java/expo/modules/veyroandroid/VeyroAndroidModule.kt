package expo.modules.veyroandroid

import android.app.AppOpsManager
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.os.Build
import android.os.Process
import android.provider.Settings
import android.app.usage.UsageStatsManager
import android.app.admin.DevicePolicyManager
import android.util.Base64
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.Drawable
import android.accessibilityservice.AccessibilityServiceInfo
import android.view.accessibility.AccessibilityManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.ByteArrayOutputStream

class VeyroAndroidModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("VeyroAndroid")

    Function("getInstalledApps") {
      val context = appContext.reactContext ?: return@Function emptyList<Map<String, Any>>()
      val pm = context.packageManager
      val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
      val activities = if (Build.VERSION.SDK_INT >= 33) pm.queryIntentActivities(intent, PackageManager.ResolveInfoFlags.of(PackageManager.MATCH_ALL.toLong())) else @Suppress("DEPRECATION") pm.queryIntentActivities(intent, PackageManager.MATCH_ALL)
      val unique = linkedMapOf<String, Map<String, Any>>()
      val protectedPackages = setOf("android", "com.android.systemui", "com.android.settings", context.packageName)
      for (resolveInfo in activities) {
        val appInfo = resolveInfo.activityInfo?.applicationInfo ?: continue
        val packageName = appInfo.packageName
        if (unique.containsKey(packageName)) continue
        val system = (appInfo.flags and (ApplicationInfo.FLAG_SYSTEM or ApplicationInfo.FLAG_UPDATED_SYSTEM_APP)) != 0
        val selectable = !system && packageName !in protectedPackages
        val label = resolveInfo.loadLabel(pm)?.toString()?.trim().orEmpty().ifEmpty { packageName }
        unique[packageName] = mapOf(
          "id" to packageName,
          "packageName" to packageName,
          "name" to label,
          "category" to if (system) "Application système" else categoryLabel(appInfo.category),
          "system" to system,
          "selectable" to selectable,
          "icon" to iconData(resolveInfo.loadIcon(pm)),
          "selected" to (selectable && VeyroPolicy.selected(context).contains(packageName)),
        )
      }
      unique.values.sortedBy { (it["name"] as String).lowercase() }
    }

    Function("getState") {
      val context = appContext.reactContext ?: return@Function mapOf("enabled" to false, "selectedPackageNames" to emptyList<String>(), "schedules" to emptyList<Map<String, Any>>(), "accessibilityEnabled" to false, "usageAccessEnabled" to false, "deviceOwner" to false, "mode" to "custom")
      val schedules = VeyroPolicy.schedules(context)
      mapOf(
        "enabled" to VeyroPolicy.enabled(context),
        "selectedPackageNames" to VeyroPolicy.selected(context).toList(),
        "schedules" to (0 until schedules.length()).mapNotNull { i -> schedules.optJSONObject(i)?.let { item ->
          mapOf("start" to item.optString("start"), "end" to item.optString("end"), "days" to (0 until (item.optJSONArray("days")?.length() ?: 0)).map { d -> item.getJSONArray("days").optInt(d) }, "enabled" to item.optBoolean("enabled", true))
        } },
        "accessibilityEnabled" to isAccessibilityEnabled(context),
        "usageAccessEnabled" to hasUsageAccess(context),
        "deviceOwner" to context.getSystemService(DevicePolicyManager::class.java).isDeviceOwnerApp(context.packageName),
        "mode" to VeyroPolicy.mode(context),
      )
    }

    Function("getFocusStats") {
      val context = appContext.reactContext ?: return@Function mapOf("todaySessions" to 0, "todayMinutes" to 0, "weekMinutes" to List(7) { 0 })
      VeyroPolicy.focusStats(context)
    }

    Function("getUsageSummary") {
      val context = appContext.reactContext ?: return@Function mapOf("hasAccess" to false, "totalMilliseconds" to 0L)
      val allowed = hasUsageAccess(context)
      if (!allowed) return@Function mapOf("hasAccess" to false, "totalMilliseconds" to 0L)
      val start = java.util.Calendar.getInstance().apply { set(java.util.Calendar.HOUR_OF_DAY, 0); set(java.util.Calendar.MINUTE, 0); set(java.util.Calendar.SECOND, 0); set(java.util.Calendar.MILLISECOND, 0) }.timeInMillis
      val end = System.currentTimeMillis()
      val stats = context.getSystemService(UsageStatsManager::class.java).queryUsageStats(UsageStatsManager.INTERVAL_DAILY, start, end)
      mapOf("hasAccess" to true, "totalMilliseconds" to (stats?.sumOf { it.totalTimeInForeground } ?: 0L))
    }

    AsyncFunction("savePolicy") { enabled: Boolean, packages: List<String>, schedules: List<Map<String, Any?>>, mode: String ->
      val context = appContext.reactContext ?: return@AsyncFunction
      VeyroPolicy.save(context, enabled, packages, schedules, mode)
      VeyroAccessibilityService.refreshIfRunning()
      VeyroSessionService.sync(context)
    }

    Function("requestNotificationPermission") {
      if (Build.VERSION.SDK_INT >= 33) {
        appContext.currentActivity?.runOnUiThread {
          appContext.currentActivity?.requestPermissions(arrayOf(android.Manifest.permission.POST_NOTIFICATIONS), 7318)
        }
      }
    }

    Function("openAccessibilitySettings") {
      appContext.currentActivity?.startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
    }

    Function("openUsageAccessSettings") {
      appContext.currentActivity?.startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS))
    }

    Function("hasAccessibilityPermission") {
      val context = appContext.reactContext ?: return@Function false
      isAccessibilityEnabled(context)
    }
  }

  private fun hasUsageAccess(context: android.content.Context): Boolean {
    val appOps = context.getSystemService(AppOpsManager::class.java)
    @Suppress("DEPRECATION")
    return appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName) == AppOpsManager.MODE_ALLOWED
  }

  private fun isAccessibilityEnabled(context: android.content.Context): Boolean {
    val manager = context.getSystemService(AccessibilityManager::class.java) ?: return false
    return manager.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK)
      .any { it.resolveInfo.serviceInfo.packageName == context.packageName && it.resolveInfo.serviceInfo.name == VeyroAccessibilityService::class.java.name }
  }

  private fun iconData(drawable: Drawable): String {
    val bitmap = Bitmap.createBitmap(96, 96, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    drawable.setBounds(0, 0, canvas.width, canvas.height)
    drawable.draw(canvas)
    val stream = ByteArrayOutputStream()
    bitmap.compress(Bitmap.CompressFormat.PNG, 90, stream)
    bitmap.recycle()
    return Base64.encodeToString(stream.toByteArray(), Base64.NO_WRAP)
  }

  private fun categoryLabel(category: Int): String = when (category) {
    ApplicationInfo.CATEGORY_GAME -> "Jeux"
    ApplicationInfo.CATEGORY_AUDIO -> "Audio"
    ApplicationInfo.CATEGORY_VIDEO -> "Vidéo"
    ApplicationInfo.CATEGORY_IMAGE -> "Photo"
    ApplicationInfo.CATEGORY_SOCIAL -> "Réseaux sociaux"
    ApplicationInfo.CATEGORY_NEWS -> "Actualités"
    ApplicationInfo.CATEGORY_MAPS -> "Cartes"
    ApplicationInfo.CATEGORY_PRODUCTIVITY -> "Productivité"
    else -> "Application installée"
  }
}

const { withAndroidManifest } = require("expo/config-plugins");

module.exports = function withVeyroAndroid(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    manifest["uses-permission"] = manifest["uses-permission"] || [];
    const permissions = new Set(manifest["uses-permission"].map((item) => item.$["android:name"]));
    for (const permission of [
      "android.permission.QUERY_ALL_PACKAGES",
      "android.permission.PACKAGE_USAGE_STATS",
      "android.permission.POST_NOTIFICATIONS",
      "android.permission.RECEIVE_BOOT_COMPLETED",
      "android.permission.FOREGROUND_SERVICE",
      "android.permission.FOREGROUND_SERVICE_SPECIAL_USE",
    ]) {
      if (!permissions.has(permission)) manifest["uses-permission"].push({ $: { "android:name": permission } });
    }

    const application = manifest.application?.[0];
    if (!application) throw new Error("Veyro: Android application entry not found");
    application.service = application.service || [];
    const serviceName = "expo.modules.veyroandroid.VeyroAccessibilityService";
    if (!application.service.some((service) => service.$["android:name"] === serviceName)) {
      application.service.push({
        $: {
          "android:name": serviceName,
          "android:label": "Veyro",
          "android:permission": "android.permission.BIND_ACCESSIBILITY_SERVICE",
          "android:exported": "true",
        },
        "intent-filter": [{ action: [{ $: { "android:name": "android.accessibilityservice.AccessibilityService" } }] }],
        "meta-data": [{ $: { "android:name": "android.accessibilityservice", "android:resource": "@xml/veyro_accessibility_config" } }],
      });
    }
    application.service = application.service || [];
    if (!application.service.some((service) => service.$["android:name"] === "expo.modules.veyroandroid.VeyroSessionService")) application.service.push({
      $: {
        "android:name": "expo.modules.veyroandroid.VeyroSessionService",
        "android:exported": "false",
        "android:foregroundServiceType": "specialUse",
      },
      "property": [{ $: { "android:name": "android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE", "android:value": "Maintains the user's active focus blocking session and its ongoing countdown notification" } }],
    });
    application.receiver = application.receiver || [];
    if (!application.receiver.some((receiver) => receiver.$["android:name"] === "expo.modules.veyroandroid.VeyroBootReceiver")) application.receiver.push({
      $: { "android:name": "expo.modules.veyroandroid.VeyroBootReceiver", "android:enabled": "true", "android:exported": "true" },
      "intent-filter": [{ action: [
        { $: { "android:name": "android.intent.action.BOOT_COMPLETED" } },
        { $: { "android:name": "android.intent.action.MY_PACKAGE_REPLACED" } },
      ] }],
    });
    if (!application.receiver.some((receiver) => receiver.$["android:name"] === "expo.modules.veyroandroid.VeyroDeviceAdminReceiver")) application.receiver.push({
      $: { "android:name": "expo.modules.veyroandroid.VeyroDeviceAdminReceiver", "android:permission": "android.permission.BIND_DEVICE_ADMIN", "android:exported": "true", "android:label": "Veyro" },
      "intent-filter": [{ action: [{ $: { "android:name": "android.app.action.DEVICE_ADMIN_ENABLED" } }] }],
      "meta-data": [{ $: { "android:name": "android.app.device_admin", "android:resource": "@xml/veyro_device_admin" } }],
    });
    return config;
  });
};

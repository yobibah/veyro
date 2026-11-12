const { withAndroidManifest } = require("expo/config-plugins");

module.exports = function withVeyroAndroid(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    manifest["uses-permission"] = manifest["uses-permission"] || [];
    const permissions = new Set(manifest["uses-permission"].map((item) => item.$["android:name"]));
    for (const permission of [
      "android.permission.QUERY_ALL_PACKAGES",
      "android.permission.PACKAGE_USAGE_STATS",
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
    return config;
  });
};

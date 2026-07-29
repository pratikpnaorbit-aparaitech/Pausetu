const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withAndroidQueries(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    if (!androidManifest.manifest) {
      androidManifest.manifest = {};
    }
    if (!androidManifest.manifest.queries) {
      androidManifest.manifest.queries = [{}];
    }
    
    const queries = androidManifest.manifest.queries[0];
    if (!queries.intent) {
      queries.intent = [];
    }
    if (!queries.package) {
      queries.package = [];
    }

    // Add whatsapp intent
    const hasWhatsappIntent = queries.intent.some(
      (i) => i.data && i.data.some((d) => d.$ && d.$['android:scheme'] === 'whatsapp')
    );
    if (!hasWhatsappIntent) {
      queries.intent.push({
        action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
        data: [{ $: { 'android:scheme': 'whatsapp' } }],
      });
    }

    // Add tel intent
    const hasTelIntent = queries.intent.some(
      (i) => i.data && i.data.some((d) => d.$ && d.$['android:scheme'] === 'tel')
    );
    if (!hasTelIntent) {
      queries.intent.push({
        action: [{ $: { 'android:name': 'android.intent.action.DIAL' } }],
        data: [{ $: { 'android:scheme': 'tel' } }],
      });
    }

    // Add packages
    const hasWhatsappPkg = queries.package.some((p) => p.$ && p.$['android:name'] === 'com.whatsapp');
    if (!hasWhatsappPkg) {
      queries.package.push({ $: { 'android:name': 'com.whatsapp' } });
    }

    const hasWhatsappBusinessPkg = queries.package.some((p) => p.$ && p.$['android:name'] === 'com.whatsapp.w4b');
    if (!hasWhatsappBusinessPkg) {
      queries.package.push({ $: { 'android:name': 'com.whatsapp.w4b' } });
    }

    return config;
  });
};

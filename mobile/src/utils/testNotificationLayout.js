/**
 * Verification Script for Notification Layout & Notification Channel Configuration
 */

const fs = require('fs');
const path = require('path');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✔ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failedTests++;
  }
}

console.log('====================================================');
console.log('  RUNNING NOTIFICATION LAYOUT & CHANNEL VERIFICATION');
console.log('====================================================\n');

// 1. Inspect NotificationCard.js file content
console.log('Test 1: Inspecting NotificationCard.js Layout Styles');
const cardPath = path.join(__dirname, '../components/NotificationCard.js');
const cardContent = fs.readFileSync(cardPath, 'utf8');

assert(cardContent.includes("backgroundColor: 'transparent'"), 'Container outer background is set to transparent (NO red spillover)');
assert(cardContent.includes("width: 90") && cardContent.includes("right: 0"), 'deleteBackground is pinned right with explicit width: 90');
assert(cardContent.includes("borderTopRightRadius: 20"), 'deleteBackground has borderTopRightRadius');
assert(cardContent.includes("Math.max(gestureState.dx, -90)"), 'PanResponder swipe translation is clamped to max -90px');
assert(cardContent.includes("useNativeDriver: true"), 'PanResponder animations use native driver');

// 2. Inspect notificationService.js
console.log('\nTest 2: Inspecting notificationService.js Channel & Handler Config');
const servicePath = path.join(__dirname, '../services/notificationService.js');
const serviceContent = fs.readFileSync(servicePath, 'utf8');

assert(serviceContent.includes('priority: Notifications.AndroidNotificationPriority.MAX'), 'Foreground notification presentation handler priority is set to MAX');
assert(serviceContent.includes('Notifications.AndroidImportance.MAX'), 'Android Channels importance is set to MAX');
assert(serviceContent.includes("lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC"), 'Lockscreen visibility set to PUBLIC');
assert(serviceContent.includes("enableVibrate: true"), 'Vibration is explicitly enabled on notification channels');
assert(serviceContent.includes("sound: 'default'"), 'Default notification sound is configured on notification channels');

// 3. Inspect app.json
console.log('\nTest 3: Inspecting app.json Expo Notifications Plugin');
const appJsonPath = path.join(__dirname, '../../app.json');
const appJsonContent = fs.readFileSync(appJsonPath, 'utf8');

assert(appJsonContent.includes('"expo-notifications"'), 'expo-notifications plugin configured in app.json');
assert(appJsonContent.includes('"color": "#16A34A"'), 'Notification primary color accent configured in app.json');

console.log('\n====================================================');
console.log(`  VERIFICATION RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('====================================================\n');

if (failedTests > 0) {
  process.exit(1);
}

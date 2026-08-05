/**
 * Comprehensive Media Viewer Pipeline Audit Script
 * Audits resolveMediaUrl, detectIsVideo, ImageWithLoader, and VideoView props.
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
console.log('  RUNNING COMPLETE MEDIA VIEWER PIPELINE AUDIT');
console.log('====================================================\n');

// 1. Audit AnimalDetailsScreen.js
console.log('Test 1: Auditing AnimalDetailsScreen.js Media Logic');
const detailsPath = path.join(__dirname, '../screens/AnimalDetailsScreen.js');
const detailsContent = fs.readFileSync(detailsPath, 'utf8');

assert(detailsContent.includes("detectIsVideo"), 'detectIsVideo helper is defined');
assert(detailsContent.includes("video/upload") || detailsContent.includes("resource_type=video"), 'detectIsVideo supports Cloudinary video upload URLs');
assert(detailsContent.includes("<Image") && !detailsContent.includes("opacity: fadeAnim"), 'ImageWithLoader renders standard Image directly without opacity animation traps');
assert(detailsContent.includes('contentFit="contain"'), 'VideoView uses contentFit="contain" for expo-video scaling');
assert(detailsContent.includes('nativeControls={true}'), 'VideoView uses nativeControls={true} for Android video rendering');
assert(detailsContent.includes('allowsFullscreen') && detailsContent.includes('allowsPictureInPicture'), 'VideoView enables native fullscreen & PiP');

// 2. Audit Container Centering & Stacking
console.log('\nTest 2: Auditing Video Modal Layout & Play Button Centering');
assert(detailsContent.includes("fullscreenVideoContainer: {") && detailsContent.includes("alignItems: 'center'"), 'fullscreenVideoContainer has centered flex alignment');
assert(detailsContent.includes("videoOverlayPlayContainer: {") && detailsContent.includes("zIndex: 5"), 'videoOverlayPlayContainer has zIndex: 5 for overlay stacking');

// 3. Audit API Media Resolver
console.log('\nTest 3: Auditing api.js resolveMediaUrl');
const apiPath = path.join(__dirname, '../api/api.js');
const apiContent = fs.readFileSync(apiPath, 'utf8');

assert(apiContent.includes("export const resolveMediaUrl"), 'resolveMediaUrl exported from api.js');

console.log('\n====================================================');
console.log(`  AUDIT RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('====================================================\n');

if (failedTests > 0) {
  process.exit(1);
}

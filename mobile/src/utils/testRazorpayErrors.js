/**
 * Unit Verification Script for Razorpay Error Handler
 * Tests all 7 Razorpay error categories & edge cases.
 */

// Mock react-native Alert before importing handler
const mockAlerts = [];
const mockConsoleErrors = [];

global.Alert = {
  alert: (title, message, buttons, options) => {
    mockAlerts.push({ title, message, buttons, options });
  }
};

// Store original console.error
const origConsoleError = console.error;
console.error = (...args) => {
  mockConsoleErrors.push(args);
  // Optional: keep logging for visibility during runner execution
  origConsoleError.apply(console, args);
};

const {
  parseRazorpayError,
  mapRazorpayErrorToCategory,
  getHumanReadableError,
  showRazorpayErrorAlert,
  RAZORPAY_ERROR_CATEGORIES
} = require('./razorpayErrorHandler');

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
console.log('  RUNNING RAZORPAY ERROR HANDLING TEST SUITE');
console.log('====================================================\n');

// 1. BAD_REQUEST_ERROR with raw JSON stringified description
console.log('Test 1: BAD_REQUEST_ERROR with raw stringified JSON');
const rawJsonError = '{"error":{"code":"BAD_REQUEST_ERROR","description":"Payment failed due to invalid card details","reason":"payment_failed"}}';
const category1 = mapRazorpayErrorToCategory(rawJsonError);
const human1 = getHumanReadableError(rawJsonError);
assert(category1 === RAZORPAY_ERROR_CATEGORIES.BAD_REQUEST_ERROR, 'Category mapped to BAD_REQUEST_ERROR');
assert(human1.title === 'Payment Failed', 'Title is "Payment Failed"');
assert(!human1.message.includes('{'), 'Message contains NO JSON "{');
assert(!human1.message.includes('BAD_REQUEST'), 'Message contains NO raw error code');
assert(human1.subtext.includes('refunded'), 'Subtext mentions refund');

// 2. PAYMENT_CANCELLED
console.log('\nTest 2: PAYMENT_CANCELLED');
const cancelError = { code: 2, description: 'Payment cancelled by user' };
const category2 = mapRazorpayErrorToCategory(cancelError);
const human2 = getHumanReadableError(cancelError);
assert(category2 === RAZORPAY_ERROR_CATEGORIES.PAYMENT_CANCELLED, 'Category mapped to PAYMENT_CANCELLED');
assert(human2.title === 'Payment Cancelled', 'Title is "Payment Cancelled"');
assert(human2.isCancelled === true, 'IsCancelled flag is true');

// 3. NETWORK_ERROR
console.log('\nTest 3: NETWORK_ERROR');
const networkError = new Error('Network Error');
const category3 = mapRazorpayErrorToCategory(networkError);
const human3 = getHumanReadableError(networkError);
assert(category3 === RAZORPAY_ERROR_CATEGORIES.NETWORK_ERROR, 'Category mapped to NETWORK_ERROR');
assert(human3.title === 'Network Failure', 'Title is "Network Failure"');
assert(human3.message.includes('internet connection'), 'Message recommends checking internet');

// 4. INVALID_SIGNATURE
console.log('\nTest 4: INVALID_SIGNATURE');
const sigError = { code: 'INVALID_SIGNATURE', message: 'Signature verification failed' };
const category4 = mapRazorpayErrorToCategory(sigError);
const human4 = getHumanReadableError(sigError);
assert(category4 === RAZORPAY_ERROR_CATEGORIES.INVALID_SIGNATURE, 'Category mapped to INVALID_SIGNATURE');
assert(human4.title === 'Verification Failed', 'Title is "Verification Failed"');

// 5. ORDER_NOT_FOUND
console.log('\nTest 5: ORDER_NOT_FOUND');
const orderError = { code: 'ORDER_NOT_FOUND', status: 404 };
const category5 = mapRazorpayErrorToCategory(orderError);
const human5 = getHumanReadableError(orderError);
assert(category5 === RAZORPAY_ERROR_CATEGORIES.ORDER_NOT_FOUND, 'Category mapped to ORDER_NOT_FOUND');
assert(human5.title === 'Order Expired', 'Title is "Order Expired"');

// 6. SERVER_ERROR
console.log('\nTest 6: SERVER_ERROR');
const serverError = { response: { status: 500, data: { message: 'Internal Server Error' } } };
const category6 = mapRazorpayErrorToCategory(serverError);
const human6 = getHumanReadableError(serverError);
assert(category6 === RAZORPAY_ERROR_CATEGORIES.SERVER_ERROR, 'Category mapped to SERVER_ERROR');
assert(human6.title === 'Server Error', 'Title is "Server Error"');

// 7. UNKNOWN_ERROR / Undefined description
console.log('\nTest 7: UNKNOWN_ERROR with undefined description');
const undefinedError = { description: undefined };
const category7 = mapRazorpayErrorToCategory(undefinedError);
const human7 = getHumanReadableError(undefinedError);
assert(category7 === RAZORPAY_ERROR_CATEGORIES.UNKNOWN_ERROR, 'Category mapped to UNKNOWN_ERROR');
assert(human7.title === 'Payment Failed', 'Title is "Payment Failed"');
assert(!human7.message.includes('undefined'), 'Message does NOT contain "undefined"');
assert(!human7.message.includes('[object'), 'Message does NOT contain "[object Object]"');

// 8. End-to-end Alert & Console Log Verification
console.log('\nTest 8: showRazorpayErrorAlert() End-to-End Test');
mockAlerts.length = 0;
mockConsoleErrors.length = 0;

showRazorpayErrorAlert(rawJsonError, { onRetry: () => console.log('Retried!'), onCancel: () => console.log('Cancelled!') });

assert(mockAlerts.length === 1, 'Alert.alert was invoked exactly once');
assert(mockConsoleErrors.length === 1, 'console.error was invoked for developer logging');
assert(mockConsoleErrors[0][0] === '[RAZORPAY]', 'Developer console log starts with [RAZORPAY]');
assert(!mockAlerts[0].message.includes('BAD_REQUEST_ERROR'), 'Alert message contains NO raw JSON/error codes');
assert(mockAlerts[0].buttons.length === 2, 'Alert has 2 buttons (Cancel and Retry)');

console.log('\n====================================================');
console.log(`  TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('====================================================\n');

if (failedTests > 0) {
  process.exit(1);
}

/**
 * Razorpay Error Handler for Production UX
 * Ensures NO raw JSON, undefined strings, or internal API payloads are ever shown to the user.
 * Logs full raw error object ONLY to developer console.
 */

let AlertModule = null;
try {
  // Safe resolution for React Native / Expo environment vs Node testing environment
  AlertModule = require('react-native').Alert;
} catch (e) {
  AlertModule = null;
}

// Error Categories
export const RAZORPAY_ERROR_CATEGORIES = {
  PAYMENT_CANCELLED: 'PAYMENT_CANCELLED',
  BAD_REQUEST_ERROR: 'BAD_REQUEST_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

/**
 * Safely parse any Razorpay error object, string, or Axios response.
 * Extract error code, description, reason, and status without throwing.
 */
export function parseRazorpayError(error) {
  if (!error) {
    return { code: null, description: null, reason: null, status: null };
  }

  let code = null;
  let description = null;
  let reason = null;
  let status = null;

  // 1. If error is a JSON string itself
  if (typeof error === 'string') {
    const trimmed = error.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        return parseRazorpayError(parsed);
      } catch (e) {
        description = trimmed;
      }
    } else {
      description = trimmed;
    }
  } else if (typeof error === 'object') {
    // 2. Direct property checks
    code = error.code || error.errorCode || null;
    reason = error.reason || null;
    status = error.status || error.statusCode || error.response?.status || null;

    // Check nested `error` object (e.g. { error: { code: 'BAD_REQUEST_ERROR', description: '...' } })
    if (error.error && typeof error.error === 'object') {
      code = error.error.code || code;
      reason = error.error.reason || reason;
      if (typeof error.error.description === 'string') {
        description = error.error.description;
      }
    }

    // Check error.response?.data
    if (error.response && error.response.data) {
      const data = error.response.data;
      if (typeof data === 'object') {
        code = data.code || code;
        reason = data.reason || reason;
        if (typeof data.message === 'string') description = data.message;
        if (typeof data.description === 'string') description = data.description;
      }
    }

    // Check error.description
    if (!description && typeof error.description === 'string') {
      description = error.description;
    }

    // Check error.message
    if (!description && typeof error.message === 'string') {
      description = error.message;
    }

    // 3. Inspect if description or message itself contains nested stringified JSON
    if (description && typeof description === 'string') {
      const trimmedDesc = description.trim();
      if (trimmedDesc.startsWith('{') && trimmedDesc.endsWith('}')) {
        try {
          const nestedJson = JSON.parse(trimmedDesc);
          const nestedParsed = parseRazorpayError(nestedJson);
          code = nestedParsed.code || code;
          reason = nestedParsed.reason || reason;
          description = nestedParsed.description || null;
        } catch (e) {
          // If JSON parse fails, keep original description check below
        }
      }
    }
  }

  // 4. Sanitize description: Never return stringified JSON, '[object Object]', or 'undefined'
  if (description) {
    const trimmedDesc = String(description).trim();
    if (
      trimmedDesc.startsWith('{') ||
      trimmedDesc.includes('"error":') ||
      trimmedDesc.includes('BAD_REQUEST_ERROR') ||
      trimmedDesc === '[object Object]' ||
      trimmedDesc.toLowerCase() === 'undefined'
    ) {
      description = null;
    }
  }

  return { code, description, reason, status };
}

/**
 * Categorize parsed error into one of the 7 standard Razorpay categories.
 */
export function mapRazorpayErrorToCategory(error) {
  const { code, description, reason, status } = parseRazorpayError(error);

  const codeStr = String(code || '').toUpperCase();
  const reasonStr = String(reason || '').toLowerCase();
  const descStr = String(description || '').toLowerCase();

  // 1. PAYMENT_CANCELLED
  if (
    code === 2 ||
    code === '2' ||
    codeStr === 'PAYMENT_CANCELLED' ||
    reasonStr.includes('cancel') ||
    descStr.includes('cancel') ||
    descStr.includes('dismissed') ||
    descStr.includes('payment cancelled by user')
  ) {
    return RAZORPAY_ERROR_CATEGORIES.PAYMENT_CANCELLED;
  }

  // 2. BAD_REQUEST_ERROR
  if (
    codeStr === 'BAD_REQUEST_ERROR' ||
    codeStr === 'BAD_REQUEST' ||
    reasonStr.includes('payment_failed') ||
    reasonStr.includes('card_declined') ||
    reasonStr.includes('invalid') ||
    descStr.includes('bad_request') ||
    status === 400
  ) {
    return RAZORPAY_ERROR_CATEGORIES.BAD_REQUEST_ERROR;
  }

  // 3. NETWORK_ERROR
  if (
    codeStr === 'NETWORK_ERROR' ||
    descStr.includes('network') ||
    descStr.includes('timeout') ||
    descStr.includes('offline') ||
    descStr.includes('internet') ||
    descStr.includes('econnrefused') ||
    descStr.includes('net::err') ||
    descStr.includes('failed to fetch')
  ) {
    return RAZORPAY_ERROR_CATEGORIES.NETWORK_ERROR;
  }

  // 4. INVALID_SIGNATURE
  if (
    codeStr === 'INVALID_SIGNATURE' ||
    descStr.includes('invalid signature') ||
    descStr.includes('signature verification failed') ||
    descStr.includes('tampered')
  ) {
    return RAZORPAY_ERROR_CATEGORIES.INVALID_SIGNATURE;
  }

  // 5. ORDER_NOT_FOUND
  if (
    codeStr === 'ORDER_NOT_FOUND' ||
    status === 404 ||
    descStr.includes('order_not_found') ||
    descStr.includes('order not found') ||
    descStr.includes('order expired')
  ) {
    return RAZORPAY_ERROR_CATEGORIES.ORDER_NOT_FOUND;
  }

  // 6. SERVER_ERROR
  if (
    codeStr === 'SERVER_ERROR' ||
    (typeof status === 'number' && status >= 500) ||
    descStr.includes('server error') ||
    descStr.includes('internal server') ||
    descStr.includes('gateway timeout')
  ) {
    return RAZORPAY_ERROR_CATEGORIES.SERVER_ERROR;
  }

  // 7. UNKNOWN_ERROR / Default Fallback
  return RAZORPAY_ERROR_CATEGORIES.UNKNOWN_ERROR;
}

/**
 * Get human-readable user-facing title, message, subtext, and metadata.
 */
export function getHumanReadableError(error) {
  const category = mapRazorpayErrorToCategory(error);

  const defaultSubtext = 'If money was deducted, it will automatically be refunded or verified shortly.';

  switch (category) {
    case RAZORPAY_ERROR_CATEGORIES.PAYMENT_CANCELLED:
      return {
        category,
        title: 'Payment Cancelled',
        message: 'You cancelled the payment transaction. No money was deducted.',
        subtext: null,
        isCancelled: true
      };

    case RAZORPAY_ERROR_CATEGORIES.BAD_REQUEST_ERROR:
      return {
        category,
        title: 'Payment Failed',
        message: "We couldn't complete your payment. Please check your details and try again.",
        subtext: defaultSubtext,
        isCancelled: false
      };

    case RAZORPAY_ERROR_CATEGORIES.NETWORK_ERROR:
      return {
        category,
        title: 'Network Failure',
        message: 'Unable to connect to the payment server. Please check your internet connection and try again.',
        subtext: defaultSubtext,
        isCancelled: false
      };

    case RAZORPAY_ERROR_CATEGORIES.INVALID_SIGNATURE:
      return {
        category,
        title: 'Verification Failed',
        message: 'Payment verification failed. We could not authenticate the transaction signature.',
        subtext: defaultSubtext,
        isCancelled: false
      };

    case RAZORPAY_ERROR_CATEGORIES.ORDER_NOT_FOUND:
      return {
        category,
        title: 'Order Expired',
        message: 'The payment session or order could not be found or has expired. Please try again.',
        subtext: defaultSubtext,
        isCancelled: false
      };

    case RAZORPAY_ERROR_CATEGORIES.SERVER_ERROR:
      return {
        category,
        title: 'Server Error',
        message: 'Our payment server encountered a temporary error. Please try again in a few moments.',
        subtext: defaultSubtext,
        isCancelled: false
      };

    case RAZORPAY_ERROR_CATEGORIES.UNKNOWN_ERROR:
    default:
      return {
        category,
        title: 'Payment Failed',
        message: "We couldn't complete your payment. Please try again.",
        subtext: defaultSubtext,
        isCancelled: false
      };
  }
}

/**
 * Display professional production alert for Razorpay errors.
 * Logs complete raw error ONLY in developer console.
 *
 * @param {any} rawError Raw error object/string from Razorpay or API call
 * @param {object} options Options object containing { onRetry, onCancel }
 */
export function showRazorpayErrorAlert(rawError, { onRetry, onCancel } = {}) {
  // 1. Log complete raw error ONLY in developer console
  console.error('[RAZORPAY]', rawError);

  // 2. Get human-readable error payload
  const { title, message, subtext, isCancelled } = getHumanReadableError(rawError);

  // 3. Format complete user-facing message string
  const displayMessage = subtext ? `${message}\n\n${subtext}` : message;

  // 4. Action buttons
  let buttons = [];

  if (isCancelled) {
    buttons = [
      {
        text: 'OK',
        onPress: () => {
          if (onCancel) onCancel();
        }
      }
    ];
    if (onRetry) {
      buttons.unshift({
        text: 'Retry',
        onPress: () => onRetry()
      });
    }
  } else {
    buttons = [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: () => {
          if (onCancel) onCancel();
        }
      }
    ];
    if (onRetry) {
      buttons.push({
        text: 'Retry',
        onPress: () => onRetry()
      });
    }
  }

  // 5. Show clean production alert via React Native Alert or global fallback
  if (AlertModule && AlertModule.alert) {
    AlertModule.alert(title, displayMessage, buttons, { cancelable: true });
  } else if (typeof global !== 'undefined' && global.Alert && global.Alert.alert) {
    global.Alert.alert(title, displayMessage, buttons, { cancelable: true });
  }
}

export default {
  RAZORPAY_ERROR_CATEGORIES,
  parseRazorpayError,
  mapRazorpayErrorToCategory,
  getHumanReadableError,
  showRazorpayErrorAlert
};

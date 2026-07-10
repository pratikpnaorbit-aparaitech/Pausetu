/**
 * Express Async Handler Wrapper
 * Catches any rejected promises from asynchronous route handlers and passes them to next()
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;

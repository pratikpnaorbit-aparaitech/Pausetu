const { verifyToken } = require('../utils/jwt');
const { AppError } = require('./errorHandler');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Middleware to protect routes and verify user authentication via JWT
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Check if token exists in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  // 2. Verify token
  try {
    const decoded = verifyToken(token);
    // Attach decoded user info (e.g. id, role) to the request object
    req.user = decoded;
    next();
  } catch (error) {
    return next(new AppError('Invalid or expired token. Please log in again.', 401));
  }
});

/**
 * Middleware to restrict access to specific roles (e.g. admin, seller)
 * @param {...String} roles - Allowed roles
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

/**
 * Optional middleware: populates req.user from a Bearer JWT if one is provided
 * and valid, but NEVER blocks the request if the token is absent or invalid.
 * Use this on public endpoints (e.g. GET /api/animals) so that admin/seller
 * identity can be detected without breaking unauthenticated access.
 */
const optionalProtect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        try {
          req.user = verifyToken(token);
        } catch (_) {
          // Token is invalid/expired — treat as unauthenticated, do not block
          req.user = undefined;
        }
      }
    }
  } catch (_) {
    req.user = undefined;
  }
  next();
};

module.exports = {
  protect,
  restrictTo,
  optionalProtect
};

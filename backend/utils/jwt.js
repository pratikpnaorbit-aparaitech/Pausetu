const jwt = require('jsonwebtoken');

/**
 * Generate a JWT access token for a given user payload
 * @param {Object} payload - User identification/role information
 * @returns {String} Signed JWT token
 */
const generateToken = (payload) => {
  const secret = process.env.JWT_SECRET || 'pashusetu_super_secret_key_123456';
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verify a given JWT access token
 * @param {String} token - The JWT token to verify
 * @returns {Object} Decoded payload if valid
 */
const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET || 'pashusetu_super_secret_key_123456';
  return jwt.verify(token, secret);
};

/**
 * Generate a JWT refresh token for a given user payload
 * @param {Object} payload - User identification
 * @returns {String} Signed JWT Refresh token
 */
const generateRefreshToken = (payload) => {
  const secret = process.env.JWT_REFRESH_SECRET || 'pashusetu_refresh_secret_key_987654';
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d'; // Refresh tokens are long-lived
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verify a given JWT refresh token
 * @param {String} token - The JWT refresh token to verify
 * @returns {Object} Decoded payload if valid
 */
const verifyRefreshToken = (token) => {
  const secret = process.env.JWT_REFRESH_SECRET || 'pashusetu_refresh_secret_key_987654';
  return jwt.verify(token, secret);
};

module.exports = {
  generateToken,
  verifyToken,
  generateRefreshToken,
  verifyRefreshToken
};

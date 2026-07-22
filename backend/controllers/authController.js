const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Otp = require('../models/Otp');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../middleware/errorHandler');
const { sendOtpEmail } = require('../services/emailService');
const { generateToken, generateRefreshToken } = require('../utils/jwt');

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Send OTP - POST /api/auth/send-otp
 */
exports.sendOtp = asyncHandler(async (req, res, next) => {
  let { email } = req.body;

  // 1. Sanitize and validate email
  if (!email) {
    return next(new AppError('Please provide an email address', 400));
  }
  email = email.trim().toLowerCase();

  if (!isValidEmail(email)) {
    return next(new AppError('Please provide a valid email address', 400));
  }

  // 2. Controller-level rate limiting: Prevent spamming multiple requests (must wait 60s)
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  const activeOtp = await Otp.findOne({
    email,
    createdAt: { $gt: oneMinuteAgo }
  });

  if (activeOtp) {
    return next(
      new AppError('Please wait 60 seconds before requesting another OTP', 429)
    );
  }

  // 3. Generate a secure random 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

  // 4. Clear any old OTP records for this email to avoid duplicates
  await Otp.deleteMany({ email });

  // 5. Store hashed OTP in the database (hashed via pre-save hook in Otp model)
  const newOtp = await Otp.create({
    email,
    otp,
    expiresAt
  });

  // 6. Send OTP via email service (cleanup OTP record on failure to avoid false 60s cooldown)
  try {
    await sendOtpEmail({ to: email, otp, expiresIn: '5 minutes' });
  } catch (emailError) {
    await Otp.deleteOne({ _id: newOtp._id });
    console.error(`[SEND OTP ERROR] Email dispatch failed for ${email}:`, emailError.message);
    return next(new AppError('Failed to send OTP email. Please try again.', 500));
  }

  res.status(200).json({
    status: 'success',
    message: 'OTP sent successfully to email'
  });
});

/**
 * Verify OTP - POST /api/auth/verify-otp
 */
exports.verifyOtp = asyncHandler(async (req, res, next) => {
  let { email, otp } = req.body;

  // 1. Sanitize and validate inputs
  if (!email || !otp) {
    return next(new AppError('Please provide email and OTP code', 400));
  }
  email = email.trim().toLowerCase();
  otp = otp.trim();

  // 2. Fetch the latest OTP record for this email
  const otpRecord = await Otp.findOne({ email }).sort({ createdAt: -1 });

  if (!otpRecord) {
    return next(new AppError('No OTP request found for this email address', 404));
  }

  // 3. Check if OTP is already verified (prevent reuse)
  if (otpRecord.verified) {
    return next(new AppError('This OTP code has already been verified and cannot be reused', 400));
  }

  // 4. Check if OTP has expired
  if (otpRecord.expiresAt < new Date()) {
    return next(new AppError('This OTP code has expired. Please request a new one', 400));
  }

  // 5. Check if maximum attempts (3) is exceeded
  if (otpRecord.attempts >= 3) {
    return next(new AppError('Maximum verification attempts exceeded. Please request a new OTP', 400));
  }

  // 6. Compare candidate OTP with hashed database OTP
  const isMatch = await otpRecord.compareOtp(otp);

  if (!isMatch) {
    // Increment verification attempts
    otpRecord.attempts += 1;
    await otpRecord.save();

    const remaining = 3 - otpRecord.attempts;
    if (remaining <= 0) {
      return next(new AppError('Incorrect OTP. Maximum attempts exceeded. Please request a new one', 400));
    }
    
    return next(new AppError(`Incorrect OTP code. ${remaining} attempts remaining`, 400));
  }

  // 7. Mark the OTP record as verified (prevent future reuse)
  otpRecord.verified = true;
  await otpRecord.save();

  // 8. Find or create the user
  let user = await User.findOne({ email });
  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    const defaultName = email.split('@')[0];
    user = await User.create({
      email,
      name: defaultName,
      role: 'buyer'
    });
  }

  // 9. Generate Access and Refresh JWT Tokens
  const accessToken = generateToken({ id: user._id, role: user.role });
  const refreshToken = generateRefreshToken({ id: user._id });

  res.status(200).json({
    status: 'success',
    message: isNewUser ? 'User registered and logged in successfully' : 'Logged in successfully',
    data: {
      user,
      accessToken,
      refreshToken
    }
  });
});

/**
 * Get Current User profile - Placeholder
 */
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

/**
 * Admin Login - POST /api/auth/admin-login
 */
exports.adminLogin = asyncHandler(async (req, res, next) => {
  let { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  email = email.trim().toLowerCase();

  if (!isValidEmail(email)) {
    return next(new AppError('Please provide a valid email address', 400));
  }

  // Fetch admin user including password hash
  let user = await User.findOne({ email }).select('+password');

  // Seed system admin account if admin@pashusetu.com does not exist
  if (!user && email === 'admin@pashusetu.com') {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    user = await User.create({
      email,
      password: hashedPassword,
      name: 'Admin Nilesh',
      role: 'admin'
    });
    user = await User.findOne({ email }).select('+password');
  }

  if (!user) {
    return next(new AppError('Invalid email or password', 401));
  }

  if (user.role !== 'admin') {
    return next(new AppError('Access denied. Administrator privileges required.', 403));
  }

  // Ensure user has a hashed password
  if (!user.password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash('admin123', salt);
    await user.save();
  }

  // Compare submitted password against stored bcrypt hash
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return next(new AppError('Invalid email or password', 401));
  }

  // Generate tokens ONLY after successful password verification
  const accessToken = generateToken({ id: user._id, role: user.role });
  const refreshToken = generateRefreshToken({ id: user._id });

  res.status(200).json({
    status: 'success',
    message: 'Admin logged in successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      accessToken,
      refreshToken
    }
  });
});



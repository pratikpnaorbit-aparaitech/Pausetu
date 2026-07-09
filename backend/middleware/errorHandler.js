/**
 * Custom application error class for handling operational/predictable errors
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode || 500;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global Express error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    // Production Mode - send friendly response
    let error = { ...err };
    error.message = err.message;

    // Handle Mongoose Bad ObjectId CastError
    if (err.name === 'CastError') {
      const message = `Invalid ${err.path}: ${err.value}.`;
      error = new AppError(message, 400);
    }

    // Handle Mongoose Duplicate Fields Error
    if (err.code === 11000) {
      const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
      const message = `Duplicate field value: ${value}. Please use another value!`;
      error = new AppError(message, 400);
    }

    // Handle Mongoose Validation Error
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(el => el.message);
      const message = `Invalid input data. ${errors.join('. ')}`;
      error = new AppError(message, 400);
    }

    // Handle JWT Errors
    if (err.name === 'JsonWebTokenError') {
      error = new AppError('Invalid token. Please log in again!', 401);
    }
    if (err.name === 'TokenExpiredError') {
      error = new AppError('Your token has expired! Please log in again.', 401);
    }

    // Handle Multer Errors
    if (err.name === 'MulterError') {
      let message = err.message;
      if (err.code === 'LIMIT_FILE_SIZE') {
        message = 'File size is too large. Max limit is 100MB.';
      }
      error = new AppError(message, 400);
    }

    // Send the error response
    if (error.isOperational) {
      res.status(error.statusCode).json({
        status: error.status,
        message: error.message
      });
    } else {
      // Programming or other unknown error: don't leak details to client
      console.error('ERROR 💥', err);
      res.status(500).json({
        status: 'error',
        message: 'Something went very wrong!'
      });
    }
  }
};

module.exports = {
  AppError,
  errorHandler
};

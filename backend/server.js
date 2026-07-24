// Handle uncaught exceptions first to catch any startup issues
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const path = require('path');
const connectDB = require('./config/db');
const { errorHandler, AppError } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const animalRoutes = require('./routes/animalRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const buyerRoutes = require('./routes/buyerRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const adminRoutes = require('./routes/adminRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const premiumRoutes = require('./routes/premiumRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const masterRoutes = require('./routes/masterRoutes');
const autoSeed = require('./config/seed');

// Connect to Database and Seed Master Data
connectDB().then(() => {
  autoSeed();
});

const app = express();

// Global Middlewares
// 1. Security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// 2. Development logging
if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 3. CORS
app.use(cors());

// 4. Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Middleware to detect MIME type of files without extensions from their magic bytes before serving statically
app.use('/uploads', (req, res, next) => {
  const filePath = path.join(__dirname, 'uploads', req.path);
  const ext = path.extname(req.path);
  if (!ext) {
    const fs = require('fs');
    if (fs.existsSync(filePath)) {
      try {
        const stat = fs.statSync(filePath);
        if (stat.isFile()) {
          const buffer = Buffer.alloc(12);
          const fd = fs.openSync(filePath, 'r');
          fs.readSync(fd, buffer, 0, 12, 0);
          fs.closeSync(fd);
          
          let contentType = 'application/octet-stream';
          const hex = buffer.toString('hex');
          
          if (hex.startsWith('ffd8ff')) {
            contentType = 'image/jpeg';
          } else if (hex.startsWith('89504e47')) {
            contentType = 'image/png';
          } else if (hex.startsWith('47494638')) {
            contentType = 'image/gif';
          } else if (hex.slice(8, 24).includes('66747970')) { // "ftyp"
            contentType = 'video/mp4';
          } else if (hex.startsWith('25504446')) {
            contentType = 'application/pdf';
          }
          
          res.setHeader('Content-Type', contentType);
        }
      } catch (err) {
        console.error('[Static MIME Middleware] Error:', err.message);
      }
    }
  }
  next();
});

// 5. Static file serving (for local file uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'PashuSetu API is running',
    timestamp: new Date()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/animals', animalRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/buyers', buyerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/premium', premiumRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api', masterRoutes);

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'PashuSetu Backend API is running 🚀',
    health: '/api/health'
  });
});

// Fallback for unhandled routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handling Middleware
app.use(errorHandler);

// Port Setup
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});


require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { connectDatabase, checkConnection } = require('./config/database');
const config = require('./config/config');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const operatorRoutes = require('./routes/operators');
const bingoCenterRoutes = require('./routes/bingoCenters');
const transactionRoutes = require('./routes/transactions');
const analyticsRoutes = require('./routes/analytics');
const uploadRoutes = require('./routes/upload');
const passwordResetRoutes = require('./routes/passwordReset');

const app = express();

// ── Security middleware ───────────────────────────────────────
app.use(helmet());
const corsOrigins = config.cors.origin ? config.cors.origin.split(',') : ['*'];
app.use(cors({
  origin: corsOrigins.includes('*') ? '*' : corsOrigins,
  credentials: corsOrigins.includes('*') ? undefined : true,
}));

// ── Rate limiting ─────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.env === 'production' ? 200 : 100,
  message: { error: 'Too many requests from this IP, please try again later.' },
});
app.use('/api/', limiter);

// ── Body parsing ──────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Request logging ───────────────────────────────────────────
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next();
});

// ── Health check ──────────────────────────────────────────────
app.get('/health', async (req, res) => {
  const dbOk = await checkConnection();
  res.json({
    status: dbOk ? 'healthy' : 'degraded',
    database: dbOk ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ── API routes ────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/operators', operatorRoutes);
app.use('/api/bingo-centers', bingoCenterRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/auth', passwordResetRoutes);

// ── 404 handler ───────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

// ── Error handler ─────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────
const startServer = async () => {
  await connectDatabase();
  app.listen(config.port, () => {
    logger.info(`Server running on port ${config.port}`, {
      environment: config.env,
    });
  });
};

process.on('SIGTERM', () => { logger.info('SIGTERM received'); process.exit(0); });
process.on('SIGINT', () => { logger.info('SIGINT received'); process.exit(0); });

startServer();

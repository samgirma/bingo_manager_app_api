const logger = require('../utils/logger');

function errorHandler(err, _req, res, _next) {
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode || 500,
  });

  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message;

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = errorHandler;

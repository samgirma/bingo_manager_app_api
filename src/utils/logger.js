const winston = require('winston');
const config = require('../config/config');

const logger = winston.createLogger({
  level: config.env === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    config.env === 'development'
      ? winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const ext = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
            return `${timestamp} [${level}]: ${message}${ext}`;
          }),
        )
      : winston.format.json(),
  ),
  transports: [new winston.transports.Console()],
});

module.exports = logger;

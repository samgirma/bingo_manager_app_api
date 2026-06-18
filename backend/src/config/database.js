const { Sequelize } = require('sequelize');
const config = require('./config');
const logger = require('../utils/logger');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
  host: config.db.host,
  port: config.db.port,
  dialect: config.db.dialect,
  pool: config.db.pool,
  logging: config.env === 'development' ? (msg) => logger.debug(msg) : false,
  define: {
    timestamps: true,
    underscored: true,
  },
});

async function checkConnection() {
  try {
    await sequelize.authenticate();
    return true;
  } catch {
    return false;
  }
}

async function connectDatabase(retries = 5, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      await sequelize.authenticate();
      logger.info('PostgreSQL connection established', {
        host: config.db.host,
        database: config.db.name,
      });

      await sequelize.sync({ alter: false });
      logger.info('Database models synchronized');
      return;
    } catch (error) {
      const isLast = i === retries - 1;
      logger.error(
        isLast ? 'Unable to connect to PostgreSQL:' : `DB connection attempt ${i + 1}/${retries} failed, retrying...`,
        isLast ? error : undefined,
      );
      if (isLast) {
        logger.warn('Starting server without database – health check will report degraded');
        return;
      }
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

async function disconnectDatabase() {
  try {
    await sequelize.close();
    logger.info('MySQL connection closed');
  } catch (error) {
    logger.error('Error closing MySQL connection:', error);
  }
}

module.exports = { sequelize, connectDatabase, disconnectDatabase, checkConnection };

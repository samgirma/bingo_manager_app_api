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

async function connectDatabase() {
  try {
    await sequelize.authenticate();
    logger.info('MySQL connection established', {
      host: config.db.host,
      database: config.db.name,
    });

    // Sync models (creates tables if they don't exist)
    await sequelize.sync({ alter: false });
    logger.info('Database models synchronized');
  } catch (error) {
    logger.error('Unable to connect to MySQL:', error);
    process.exit(1);
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

module.exports = { sequelize, connectDatabase, disconnectDatabase };

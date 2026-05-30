/**
 * Seeds the database with initial admin / operator users and sample data.
 * Usage:  npm run seed
 *         DB_HOST=localhost node scripts/seed.js
 *
 * The init.sql script (auto-executed by Docker on first launch) creates the
 * schema and default admin. This script is for manual runs / development.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const bcrypt = require('bcryptjs');
const { sequelize } = require('../src/config/database');
const { User, BingoCenter, RechargeHistory } = require('../src/models');
const logger = require('../src/utils/logger');

async function seed() {
  try {
    await sequelize.authenticate();
    logger.info('Database connected');

    // Sync – create tables if they don't exist
    await sequelize.sync({ force: false });
    logger.info('Tables synchronized');

    // ── Users ────────────────────────────────────────────────
    const adminHash = await bcrypt.hash('admin123', 10);
    const [admin] = await User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        password: adminHash,
        full_name: 'System Administrator',
        email: 'admin@bingo.com',
        role: 'ADMIN',
        is_banned: false,
      },
    });

 

    logger.info(`Users ready: ${admin.username} (ADMIN)`);
    logger.info('Seed complete!');
    
  } catch (err) {
    logger.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seed();

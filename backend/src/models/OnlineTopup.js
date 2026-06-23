const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OnlineTopup = sequelize.define('OnlineTopup', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  mac_address: {
    type: DataTypes.STRING(17),
    allowNull: false,
  },
  balance: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  actual_balance: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  paid_balance: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  created_by: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
}, {
  tableName: 'online_topups',
  timestamps: true,
  underscored: true,
  indexes: [
    { unique: true, fields: ['username'] },
  ],
});

module.exports = OnlineTopup;

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RechargeHistory = sequelize.define('RechargeHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  actual_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  generated_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  bingo_center_username: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  debited_by: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'recharge_history',
  timestamps: false,
  underscored: true,
});

module.exports = RechargeHistory;

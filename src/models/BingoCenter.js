const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BingoCenter = sequelize.define('BingoCenter', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  full_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  balance: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  mac_address: {
    type: DataTypes.STRING(17),
    allowNull: false,
    unique: true,
  },
  created_by: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
}, {
  tableName: 'bingo_centers',
  timestamps: true,
  underscored: true,
});

module.exports = BingoCenter;

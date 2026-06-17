const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
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
  full_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  role: {
    type: DataTypes.ENUM('ADMIN', 'OPERATOR'),
    allowNull: false,
    defaultValue: 'OPERATOR',
  },
  profile_pic_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    defaultValue: null,
  },
  is_banned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
});

module.exports = User;

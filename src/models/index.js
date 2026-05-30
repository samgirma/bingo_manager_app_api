const User = require('./User');
const BingoCenter = require('./BingoCenter');
const RechargeHistory = require('./RechargeHistory');
const Session = require('./Session');
const PasswordResetToken = require('./PasswordResetToken');

// ── Associations ──────────────────────────────────────────────

User.hasMany(Session, { foreignKey: 'user_id' });
Session.belongsTo(User, { foreignKey: 'user_id' });

// A BingoCenter is created by a User (operator)
BingoCenter.belongsTo(User, { foreignKey: 'created_by', targetKey: 'username' });

// RechargeHistory references both BingoCenter and User
BingoCenter.hasMany(RechargeHistory, { foreignKey: 'bingo_center_username', sourceKey: 'username' });
RechargeHistory.belongsTo(BingoCenter, { foreignKey: 'bingo_center_username', targetKey: 'username' });
RechargeHistory.belongsTo(User, { foreignKey: 'debited_by', targetKey: 'username' });

module.exports = {
  User,
  BingoCenter,
  RechargeHistory,
  Session,
  PasswordResetToken,
};

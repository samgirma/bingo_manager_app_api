const User = require('./User');
const BingoCenter = require('./BingoCenter');
const RechargeHistory = require('./RechargeHistory');
const Session = require('./Session');
const PasswordResetToken = require('./PasswordResetToken');
const OnlineTopup = require('./OnlineTopup');

// ── Associations ──────────────────────────────────────────────

User.hasMany(Session, { foreignKey: 'user_id' });
Session.belongsTo(User, { foreignKey: 'user_id' });

// A BingoCenter is created by a User (operator)
BingoCenter.belongsTo(User, { foreignKey: 'created_by', targetKey: 'username' });

// RechargeHistory references BingoCenter
BingoCenter.hasMany(RechargeHistory, { foreignKey: 'bingo_center_username', sourceKey: 'username' });
RechargeHistory.belongsTo(BingoCenter, { foreignKey: 'bingo_center_username', targetKey: 'username' });
// debited_by is NOT a FK — it can be a username OR "online:<username>"

// OnlineTopup references BingoCenter
BingoCenter.hasOne(OnlineTopup, { foreignKey: 'username', sourceKey: 'username' });
OnlineTopup.belongsTo(BingoCenter, { foreignKey: 'username', targetKey: 'username' });

module.exports = {
  User,
  BingoCenter,
  RechargeHistory,
  Session,
  PasswordResetToken,
  OnlineTopup,
};

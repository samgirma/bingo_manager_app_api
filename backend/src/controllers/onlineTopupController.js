const { OnlineTopup, RechargeHistory, BingoCenter } = require('../models');
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

exports.getPendingBalance = async (req, res, next) => {
  try {
    const topup = await OnlineTopup.findOne({
      where: { username: req.terminal.username },
    });

    if (!topup) {
      return res.json({
        success: true,
        total_pending: 0,
        balance: 0,
        pending: [],
      });
    }

    res.json({
      success: true,
      total_pending: parseFloat(topup.balance),
      balance: parseFloat(topup.balance),
      actual_balance: parseFloat(topup.actual_balance),
      paid_balance: parseFloat(topup.paid_balance),
      pending: [{
        id: topup.id,
        amount: parseFloat(topup.balance),
        remaining: parseFloat(topup.balance),
        created_at: topup.created_at,
      }],
    });
  } catch (err) {
    next(err);
  }
};

exports.claimBalance = async (req, res, next) => {
  try {
    const { amount } = req.body;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Valid amount is required' });
    }

    const claimVal = parseFloat(amount);

    const topup = await OnlineTopup.findOne({
      where: { username: req.terminal.username },
    });

    if (!topup || parseFloat(topup.balance) < claimVal) {
      return res.status(400).json({ success: false, error: 'Insufficient balance' });
    }

    const result = await sequelize.transaction(async (t) => {
      const newBalance = parseFloat(topup.balance) - claimVal;
      const newPaid = parseFloat(topup.paid_balance) + claimVal;

      await topup.update({ balance: newBalance, paid_balance: newPaid }, { transaction: t });

      const recharge = await RechargeHistory.create({
        actual_amount: claimVal,
        generated_amount: claimVal,
        bingo_center_username: req.terminal.username,
        debited_by: `online:${req.terminal.username}`,
      }, { transaction: t });

      return { newBalance, recharge };
    });

    logger.info(`Online claim: ${claimVal} ETB by ${req.terminal.username}`);

    res.json({
      success: true,
      claimed_amount: claimVal,
      remaining: result.newBalance,
      transaction_ref: result.recharge.id,
    });
  } catch (err) {
    next(err);
  }
};

exports.addOnlineTopup = async (req, res, next) => {
  try {
    const { bingoCenterUsername, amount, actualAmount } = req.body;

    if (!bingoCenterUsername || !amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Valid bingoCenterUsername and amount are required' });
    }

    const amountVal = parseFloat(amount);
    const actualVal = actualAmount !== undefined ? parseFloat(actualAmount) : amountVal;

    const center = await BingoCenter.findOne({ where: { username: bingoCenterUsername } });
    if (!center) {
      return res.status(404).json({ success: false, error: 'Bingo center not found' });
    }

    const result = await sequelize.transaction(async (t) => {
      const [topup] = await OnlineTopup.findOrCreate({
        where: { username: bingoCenterUsername },
        defaults: {
          mac_address: center.mac_address,
          balance: 0,
          actual_balance: 0,
          paid_balance: 0,
          created_by: req.user?.username || 'system',
        },
        transaction: t,
      });

      const newBalance = parseFloat(topup.balance) + amountVal;
      const newActual = parseFloat(topup.actual_balance) + actualVal;

      await topup.update({ balance: newBalance, actual_balance: newActual }, { transaction: t });

      const recharge = await RechargeHistory.create({
        actual_amount: actualVal,
        generated_amount: amountVal,
        bingo_center_username: bingoCenterUsername,
        debited_by: req.user?.username || 'online:system',
      }, { transaction: t });

      return { topup, recharge };
    });

    logger.info(`Online topup added: ${amountVal} ETB → ${bingoCenterUsername} by ${req.user?.username}`);

    res.status(201).json({
      success: true,
      data: {
        username: bingoCenterUsername,
        balance: parseFloat(result.topup.balance),
        actual_balance: parseFloat(result.topup.actual_balance),
        paid_balance: parseFloat(result.topup.paid_balance),
      },
      transaction_ref: result.recharge.id,
    });
  } catch (err) {
    next(err);
  }
};

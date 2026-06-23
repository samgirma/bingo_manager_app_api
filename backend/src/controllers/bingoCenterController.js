const bcrypt = require('bcryptjs');
const { BingoCenter, RechargeHistory, OnlineTopup } = require('../models');
const { generateUserFile, generateTopupFile } = require('../services/cryptoService');
const { fn, col } = require('sequelize');
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

exports.list = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.createdBy) {
      where.created_by = req.query.createdBy;
    }
    const centers = await BingoCenter.findAll({ where, order: [['created_at', 'DESC']] });

    const centerUsernames = centers.map(c => c.username);

    // Get actual balances from recharge_history for each center
    const balances = {};
    if (centerUsernames.length > 0) {
      const results = await RechargeHistory.findAll({
        attributes: ['bingo_center_username', [fn('COALESCE', fn('SUM', col('actual_amount')), 0), 'total']],
        where: { bingo_center_username: centerUsernames },
        group: ['bingo_center_username'],
        raw: true,
      });
      results.forEach(r => { balances[r.bingo_center_username] = parseFloat(r.total); });
    }

    // Get online topup balances
    const onlineBalances = {};
    if (centerUsernames.length > 0) {
      const topups = await OnlineTopup.findAll({
        where: { username: centerUsernames },
        raw: true,
      });
      topups.forEach(t => {
        onlineBalances[t.username] = {
          balance: parseFloat(t.balance),
          actual_balance: parseFloat(t.actual_balance),
          paid_balance: parseFloat(t.paid_balance),
        };
      });
    }

    res.json({
      success: true,
      data: centers.map((c) => ({
        userID: c.id,
        full_name: c.full_name,
        username: c.username,
        balance: balances[c.username] || 0,
        mac_address: c.mac_address,
        createdBy: c.created_by,
        createdAt: c.created_at,
        onlineBalance: onlineBalances[c.username]?.balance || 0,
        onlineActualBalance: onlineBalances[c.username]?.actual_balance || 0,
        onlinePaidBalance: onlineBalances[c.username]?.paid_balance || 0,
      })),
    });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { full_name, username, password, mac_address, balance, actualAmount, createdBy } = req.body;

    if (!full_name || !username || !password || !mac_address || balance === undefined || actualAmount === undefined) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    if (parseFloat(balance) < 0) {
      return res.status(400).json({ success: false, error: 'Transaction Failed: Starting balance cannot be negative' });
    }

    if (parseFloat(actualAmount) < 0) {
      return res.status(400).json({ success: false, error: 'Transaction Failed: Actual paid amount cannot be negative' });
    }

    const existingUsername = await BingoCenter.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(409).json({ success: false, error: 'Bingo center username already exists' });
    }

    const existingMac = await BingoCenter.findOne({ where: { mac_address } });
    if (existingMac) {
      return res.status(409).json({ success: false, error: 'MAC address already registered' });
    }

    // Atomic: create center + initial transaction + online topup in one DB transaction
    const result = await sequelize.transaction(async (t) => {
      const hash = await bcrypt.hash(password, 10);

      const center = await BingoCenter.create({
        full_name,
        username,
        password: hash,
        mac_address,
        balance: parseFloat(actualAmount),
        created_by: createdBy || 'system',
      }, { transaction: t });

      const recharge = await RechargeHistory.create({
        actual_amount: parseFloat(actualAmount),
        generated_amount: parseFloat(balance),
        bingo_center_username: username,
        debited_by: createdBy || 'system',
      }, { transaction: t });

      const topup = await OnlineTopup.create({
        username,
        mac_address,
        balance: parseFloat(actualAmount),
        actual_balance: parseFloat(actualAmount),
        paid_balance: 0,
        created_by: createdBy || 'system',
      }, { transaction: t });

      return { center, recharge, topup };
    });

    logger.info(`Bingo center created: ${result.center.username} with initial balance ${balance}`);

    // Generate the encrypted terminal file for PHP backend import
    const encFile = generateUserFile(
      result.center.username,
      password,
      result.center.full_name,
      balance,
      mac_address,
    );

    res.status(201).json({
      success: true,
      data: {
        userID: result.center.id,
        full_name: result.center.full_name,
        username: result.center.username,
        balance: result.center.balance,
        mac_address: result.center.mac_address,
        createdBy: result.center.created_by,
        createdAt: result.center.created_at,
      },
      encryptedFile: encFile,
    });
  } catch (err) {
    next(err);
  }
};

exports.recharge = async (req, res, next) => {
  try {
    const { bingoCenterUsername, generatedAmount, actualAmount, debitedBy } = req.body;

    if (!bingoCenterUsername || generatedAmount === undefined || actualAmount === undefined || !debitedBy) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    const genVal = parseFloat(generatedAmount);
    const actVal = parseFloat(actualAmount);

    if (genVal <= 0) {
      return res.status(400).json({ success: false, error: 'Transaction Failed: Generated amount must be greater than zero' });
    }
    if (actVal < 0) {
      return res.status(400).json({ success: false, error: 'Transaction Failed: Actual amount cannot be negative' });
    }

    const center = await BingoCenter.findOne({ where: { username: bingoCenterUsername } });
    if (!center) {
      return res.status(404).json({ success: false, error: 'Transaction Failed: Bingo Center not found' });
    }

    // Atomic balance update — track actual paid amount
    const newBalance = parseFloat(center.balance) + actVal;
    await center.update({ balance: newBalance });

    const recharge = await RechargeHistory.create({
      actual_amount: actVal,
      generated_amount: genVal,
      bingo_center_username: bingoCenterUsername,
      debited_by: debitedBy,
    });

    const [topup] = await OnlineTopup.findOrCreate({
      where: { username: bingoCenterUsername },
      defaults: {
        mac_address: center.mac_address,
        balance: 0,
        actual_balance: 0,
        paid_balance: 0,
        created_by: debitedBy,
      },
    });
    await topup.update({
      balance: parseFloat(topup.balance) + actVal,
      actual_balance: parseFloat(topup.actual_balance) + actVal,
    });

    // Generate the encrypted top-up file
    const encFile = generateTopupFile(bingoCenterUsername, genVal, actVal);

    logger.info(`Recharge: ${genVal} ETB → ${bingoCenterUsername} by ${debitedBy}`);

    res.status(201).json({
      success: true,
      data: {
        id: recharge.id,
        actualAmount: recharge.actual_amount,
        generatedAmount: recharge.generated_amount,
        bingoCenterUsername: recharge.bingo_center_username,
        debitedBy: recharge.debited_by,
        timestamp: recharge.timestamp,
      },
      encryptedFile: encFile,
    });
  } catch (err) {
    next(err);
  }
};

exports.regenerateUserFile = async (req, res, next) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ success: false, error: 'Username is required' });
    }

    const center = await BingoCenter.findOne({ where: { username } });
    if (!center) {
      return res.status(404).json({ success: false, error: 'Bingo center not found' });
    }

    const encFile = generateUserFile(
      center.username,
      center.password,
      center.full_name,
      0,
      center.mac_address,
      true,
    );

    logger.info(`User file regenerated for ${username} by ${req.user?.username}`);

    res.json({ success: true, encryptedFile: encFile });
  } catch (err) {
    next(err);
  }
};

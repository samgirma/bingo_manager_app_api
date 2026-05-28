const bcrypt = require('bcryptjs');
const { BingoCenter, RechargeHistory } = require('../models');
const { generateUserFile, generateTopupFile } = require('../services/cryptoService');
const logger = require('../utils/logger');

exports.list = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.createdBy) {
      where.created_by = req.query.createdBy;
    }
    const centers = await BingoCenter.findAll({
      where,
      order: [['created_at', 'DESC']],
    });
    res.json({
      success: true,
      data: centers.map((c) => ({
        userID: c.id,
        username: c.username,
        password: c.password,
        balance: c.balance,
        mac_address: c.mac_address,
        createdBy: c.created_by,
        createdAt: c.created_at,
      })),
    });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { username, password, mac_address, balance, createdBy } = req.body;

    if (!username || !password || !mac_address || balance === undefined) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    if (parseFloat(balance) < 0) {
      return res.status(400).json({ success: false, error: 'Transaction Failed: Starting balance cannot be negative' });
    }

    const existing = await BingoCenter.findOne({ where: { username } });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Bingo center username already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const center = await BingoCenter.create({
      username,
      password: hash,
      mac_address,
      balance: parseFloat(balance),
      created_by: createdBy || 'system',
    });

    // Generate the AES-256-CBC encrypted terminal file
    const encFile = generateUserFile(center.username, password);

    logger.info(`Bingo center created: ${center.username}`);

    res.status(201).json({
      success: true,
      data: {
        userID: center.id,
        username: center.username,
        password: center.password,
        balance: center.balance,
        mac_address: center.mac_address,
        createdBy: center.created_by,
        createdAt: center.created_at,
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

    // Atomic balance update
    const newBalance = parseFloat(center.balance) + genVal;
    await center.update({ balance: newBalance });

    const recharge = await RechargeHistory.create({
      actual_amount: actVal,
      generated_amount: genVal,
      bingo_center_username: bingoCenterUsername,
      debited_by: debitedBy,
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

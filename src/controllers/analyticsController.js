const { Op } = require('sequelize');
const { BingoCenter, RechargeHistory } = require('../models');

exports.getSystemAnalytics = async (req, res, next) => {
  try {
    const [totalBalanceResult, activeCenters, todayGeneratedTopups] = await Promise.all([
      RechargeHistory.sum('actual_amount'),
      BingoCenter.count(),
      RechargeHistory.sum('generated_amount', {
        where: {
          timestamp: {
            [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalBalance: parseFloat(totalBalanceResult || '0'),
        activeCenters,
        todayGeneratedTopups: parseFloat(todayGeneratedTopups || '0'),
      },
    });
  } catch (err) {
    next(err);
  }
};

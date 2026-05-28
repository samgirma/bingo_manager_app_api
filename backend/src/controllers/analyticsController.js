const { Op } = require('sequelize');
const { BingoCenter, RechargeHistory } = require('../models');

exports.getSystemAnalytics = async (req, res, next) => {
  try {
    const [totalBalanceResult, activeCenters, todayGeneratedTopups] = await Promise.all([
      BingoCenter.findAll({
        attributes: [
          [require('sequelize').fn('COALESCE', require('sequelize').fn('SUM', require('sequelize').col('balance')), 0), 'totalBalance'],
        ],
        raw: true,
      }),
      BingoCenter.count(),
      RechargeHistory.sum('generated_amount', {
        where: {
          timestamp: {
            [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    const totalBalance = parseFloat(totalBalanceResult[0]?.totalBalance || '0');

    res.json({
      success: true,
      data: {
        totalBalance,
        activeCenters,
        todayGeneratedTopups: parseFloat(todayGeneratedTopups || '0'),
      },
    });
  } catch (err) {
    next(err);
  }
};

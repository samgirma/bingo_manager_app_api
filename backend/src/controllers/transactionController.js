const { RechargeHistory } = require('../models');

exports.list = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.debitedBy) {
      where.debited_by = req.query.debitedBy;
    }
    const transactions = await RechargeHistory.findAll({
      where,
      order: [['timestamp', 'DESC']],
    });
    res.json({
      success: true,
      data: transactions.map((t) => ({
        id: t.id,
        actualAmount: t.actual_amount,
        generatedAmount: t.generated_amount,
        bingoCenterUsername: t.bingo_center_username,
        debitedBy: t.debited_by,
        timestamp: t.timestamp,
      })),
    });
  } catch (err) {
    next(err);
  }
};

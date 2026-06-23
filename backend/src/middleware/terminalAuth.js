const { BingoCenter } = require('../models');

async function terminalAuth(req, res, next) {
  try {
    const username = req.headers['x-username'];
    const macAddress = req.headers['x-mac-address'];

    if (!username || !macAddress) {
      return res.status(401).json({
        success: false,
        error: 'X-Username and X-MAC-Address headers are required',
      });
    }

    const center = await BingoCenter.findOne({
      where: { username, mac_address: macAddress.toUpperCase() },
    });

    if (!center) {
      return res.status(401).json({
        success: false,
        error: 'Invalid terminal credentials',
      });
    }

    req.terminal = {
      username: center.username,
      mac_address: center.mac_address,
      full_name: center.full_name,
    };

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { terminalAuth };

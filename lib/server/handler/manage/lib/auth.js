const crypto = require('crypto');
const log4js = require('log4js');

const logger = log4js.getLogger('Server: auth');
const deviation = 300;

const auth = (hash, op, time, pwdHash) => {
    const now = new Date().getTime();
    if (Math.abs(time - now) > deviation * 1000) {
        logger.error('The deviation between client time and server time is out of range');
        return false;
    }
    const hmac = crypto.createHmac('sha256', `${time}`);
    const buildStr = `${pwdHash} ${op} ${time}`;
    hmac.update(buildStr);
    const buildHash = hmac.digest('hex');
    if (buildHash !== hash) {
        logger.error('Bad password');
        return false;
    }
    return true;
};

module.exports = auth;

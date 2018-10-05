const fs = require('fs-extra');
const path = require('path');
const log4js = require('log4js');

const pommentData = require('../core/data');

const logger = log4js.getLogger('Init');
logger.level = process.env.NODE_ENV === 'development' ? 'debug' : 'info';

module.exports = (userPath = process.cwd()) => {
    const computedPath = path.resolve(process.cwd(), userPath);
    if (fs.existsSync(computedPath)) {
        if (!fs.lstatSync(computedPath).isDirectory()) {
            logger.fatal(`${computedPath} is not a directory. Exiting.`);
            process.exit(1);
        }
        if (fs.readdirSync(computedPath).length > 0) {
            logger.fatal(`Directory ${computedPath} is not empty. Exiting.`);
            process.exit(1);
        }
    }
    pommentData.init(computedPath);
};

const fs = require('fs-extra');
const path = require('path');
const log4js = require('log4js');

const pommentData = require('../core/data');
const configTemplate = require('./template/config');
const generateSalt = require('../utils/salt');

const logger = log4js.getLogger('Init');
logger.level = process.env.NODE_ENV === 'development' ? 'debug' : 'info';

module.exports = async (userPath = process.cwd()) => {
    const computedPath = path.resolve(process.cwd(), userPath);
    try {
        if (fs.existsSync(computedPath) && fs.readdirSync(computedPath).length > 0) {
            logger.fatal(`Directory ${computedPath} is not empty. Exiting.`);
            process.exit(1);
        }

        // Init basic data folder
        await pommentData.init(computedPath);

        // Init config file
        const config = configTemplate();
        config.salt = generateSalt(32);
        fs.writeJSONSync(path.join(computedPath, 'config.json'), config, {
            spaces: 4,
        });

        // Copy other files
        fs.mkdirpSync(path.join(computedPath, 'template'));
        fs.copySync(path.resolve(__dirname, 'template/user'), path.join(computedPath, 'template/'));
    } catch (e) {
        logger.fatal(e.toString());
        process.exit(1);
    }
};

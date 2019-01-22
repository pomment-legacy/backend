const fs = require('fs-extra');
const path = require('path');
const log4js = require('log4js');
const chalk = require('chalk');

const pommentData = require('../core/data');
const configTemplate = require('./template/config');
const generateSalt = require('../utils/salt');
const configTUI = require('../config');

const logger = log4js.getLogger('Init');
logger.level = process.env.NODE_ENV === 'development' ? 'debug' : 'info';

module.exports = async (userPath = process.cwd(), noConfig) => {
    const computedPath = path.resolve(process.cwd(), userPath);
    try {
        if (fs.existsSync(computedPath) && fs.readdirSync(computedPath).length > 0) {
            logger.fatal(`Directory ${computedPath} is not empty. Exiting.`);
            process.exit(1);
        }

        // Init basic data folder
        await pommentData.init(computedPath);

        if (noConfig) {
            logger.info(`Data directory initialization completed!

Directory:      ${computedPath}

${chalk.yellowBright('Configurion file (config.json) is NOT created, because --noconfig is defined.')}`);
        } else {
            // Init config file
            const config = configTemplate();
            config.salt = generateSalt(32);
            fs.writeJSONSync(path.join(computedPath, 'config.json'), config, {
                spaces: 4,
            });
            fs.writeFileSync(path.join(computedPath, 'webhooks.txt'), '', { encoding: 'utf8' });

            await configTUI(computedPath);
            logger.info(`Data directory initialization completed!

Directory:      ${computedPath}
Config File:    ${path.join(computedPath, 'config.json')}
`);
        }
    } catch (e) {
        logger.fatal(e.toString());
        process.exit(1);
    }
};

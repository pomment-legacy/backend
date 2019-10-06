const fs = require('fs-extra');
const path = require('path');
const log4js = require('log4js');
const toVersion2 = require('./to_2');

const logger = log4js.getLogger('VerCheck');

const check = (dir) => {
    const statPath = path.resolve(dir, 'status.json');
    const haveStat = fs.existsSync(statPath);
    if (!haveStat) {
        logger.info('status.json is not exist, creating...');
        const content = {
            dataVer: 1,
        };
        fs.writeJSONSync(statPath, content, { encoding: 'utf8' });
    }
    const stat = fs.readJSONSync(statPath, { encoding: 'utf8' });
    switch (stat.dataVer) {
        case 1: {
            logger.info('Upgrading to data version 2');
            toVersion2(dir);
            break;
        }
        case 2: {
            logger.debug('All good!');
            break;
        }
        default: {
            logger.fatal('Unknown data version!');
            process.exit(1);
        }
    }
};

module.exports = check;

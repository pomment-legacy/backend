import fs from 'fs-extra';
import path from 'path';
import log4js from 'log4js';

function init(entry: string) {
    const logger = log4js.getLogger('Init');
    const logLevel = process.env.PMNT_LOG_LEVEL || 'info';
    logger.level = logLevel;

    if (fs.existsSync(entry) && fs.readdirSync(entry).length > 0) {
        logger.error('Target directory is not empty.');
    }
    fs.copySync(path.resolve(__dirname, '../../assets/template'), entry);
}

export default init;

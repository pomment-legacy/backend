/* eslint-disable no-continue */

import log4js from 'log4js';
import path from 'path';
import prompt from 'prompt-sync';
import yaml from 'js-yaml';
import fs from 'fs-extra';
import sha from '../lib/sha';
import { IConfig } from '../interface/config';

function resetPassword(entry: string) {
    const logger = log4js.getLogger('Password');
    const logLevel = process.env.NODE_ENV === 'development' ? 'debug' : 'info';
    logger.level = logLevel;

    let password = '';
    while (password === '') {
        const pass1 = prompt({ sigint: true }).hide('New password: ');
        if (pass1.trim() === '') {
            process.stderr.write('Password can\'t be empty.\n');
            continue;
        }
        const pass2 = prompt({ sigint: true }).hide('Confirm password: ');
        if (pass1 !== pass2) {
            process.stderr.write('Two passwords are not equal.\n');
            continue;
        }
        password = pass1;
    }
    const tryLoad: any = yaml.safeLoad(fs.readFileSync(path.join(entry, 'config.yaml'), { encoding: 'utf8' }));
    if (!tryLoad || typeof tryLoad !== 'object') {
        process.stderr.write('Unable to parse config file.\n');
        return;
    }
    const config: IConfig = tryLoad;
    config.siteAdmin.password = sha.sha256(password);

    process.stderr.write('Writing new password to config file...\n');
    fs.writeFileSync(path.join(entry, 'config.yaml'), yaml.safeDump(config), { encoding: 'utf-8' });
}

export default resetPassword;

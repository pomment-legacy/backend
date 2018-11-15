/* eslint-disable no-use-before-define */
/* eslint-disable no-await-in-loop */

const childProcess = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const log4js = require('log4js');
const whiptail = require('../whiptail');
const SHA = require('../utils/sha');
const generateSalt = require('../utils/salt');

const logger = log4js.getLogger('Config');
logger.level = process.env.NODE_ENV === 'development' ? 'debug' : 'info';
let config;
let computedPath;

const setValue = async (obj, item, msg, transtyper) => {
    /* eslint-disable no-param-reassign */
    const temp = await whiptail.inputbox(msg, obj[item]);
    if (temp !== null) {
        if (transtyper) {
            obj[item] = transtyper(temp);
        } else {
            obj[item] = temp;
        }
    }
    return obj[item];
};

const exec = (command, args, options) => new Promise((resolve, reject) => {
    const child = childProcess.spawn(command, args, options);
    child.on('exit', (e, code) => {
        if (e) {
            reject(e);
        } else {
            resolve(code);
        }
    });
});

const editFile = async (filePath, kind, description) => {
    const editor = process.env.EDITOR || 'vi';
    if (await whiptail.yesno(`Now, we will edit ${kind}.
${description}
We will use ${editor} for this editing. If you want to use other editors, just set $EDITOR for next time.
Proceed?`)) {
        await exec(editor, [filePath], {
            stdio: 'inherit',
        });
    }
    return true;
};

const checkAdminPassword = async (str) => {
    let score = 0;
    if (str.length < 8) {
        await whiptail.msgbox('Password should be at least 8 digits.');
        return false;
    }
    if (/(\W|_)/g.test(str)) {
        score += 1;
    }
    if (/\d/g.test(str)) {
        score += 1;
    }
    if (/[a-z]/.test(str)) {
        score += 1;
    }
    if (/[A-Z]/.test(str)) {
        score += 1;
    }
    if (score < 2) {
        await whiptail.msgbox(`A valid password should contain at least two of the following types:

- Uppercase letters
- Lowercase letters
- Digits
- Special characters`);
        return false;
    }
    return true;
};

const setAdminPassword = async () => {
    let result;
    do {
        result = await whiptail.passwordbox('Input new password', '');
    } while (result !== null && !(await checkAdminPassword(result)));
    return result;
};

const generateAPIKey = async () => {
    const newKey = crypto.randomBytes(20).toString('hex');
    config.apiKey = newKey;
    await whiptail.msgbox(`The API Key feature is enabled. Please check your config.json file.
The API key is for programs using Pomment's web APIs, not for normal user logging in.`);
};

const updateConfig = () => {
    fs.writeJSONSync(path.join(computedPath, 'config.json'), config, {
        spaces: 4,
    });
};

const mainMenu = async () => {
    const result = Number(await whiptail.menu('Choose an category you want to edit', {
        1: 'Site Information',
        2: 'Admin',
        4: 'Security',
        5: 'Webhook',
        6: 'API Keys',
        7: '====================',
        8: 'Quit',
    }));
    switch (result) {
        case 1: {
            await siteInfoMenu();
            break;
        }
        case 2: {
            await adminInfoMenu();
            break;
        }
        case 4: {
            await securityMenu();
            break;
        }
        case 5: {
            await editFile(path.join(computedPath, 'webhooks.txt'), 'webhook list', 'You may define several webhook URLs in the list file, one URL per line.');
            await mainMenu();
            break;
        }
        case 6: {
            await apiMenu();
            break;
        }
        default: {
            process.exit(0);
            break;
        }
    }
};

const siteInfoMenu = async () => {
    const result = Number(await whiptail.menu('Choose an item you want to edit', {
        1: 'Hostname',
        2: 'Port',
        3: 'Website Name',
        4: 'Website URL',
        5: 'Under Proxy',
        6: '====================',
        7: 'Go Back',
    }));
    switch (result) {
        case 1: {
            await setValue(config, 'apiHost', 'Input hostname');
            break;
        }
        case 2: {
            await setValue(config, 'apiPort', 'Input port', Number);
            break;
        }
        case 3: {
            await setValue(config, 'siteName', 'Input website name');
            break;
        }
        case 4: {
            await setValue(config, 'siteURL', 'Input website URL');
            break;
        }
        case 5: {
            config.underProxy = await whiptail.yesno('Is your server under a proxy?\n\nYou should care about this option if you want visitor\'s IP address accurate in the log.');
            break;
        }
        default: {
            break;
        }
    }
    if (result <= 5) {
        updateConfig();
    }
    if (result > 0 && result <= 6) {
        await siteInfoMenu();
    } else {
        await mainMenu();
    }
};

const adminInfoMenu = async () => {
    const result = Number(await whiptail.menu('Choose an item you want to edit', {
        1: 'Nickname',
        2: 'Email Address',
        3: 'Password',
        4: '====================',
        5: 'Go Back',
    }));
    switch (result) {
        case 1: {
            await setValue(config.siteAdmin, 'name', 'Input nickname');
            break;
        }
        case 2: {
            await setValue(config.siteAdmin, 'email', 'Input email address');
            break;
        }
        case 3: {
            const temp = await setAdminPassword();
            if (temp !== null) {
                config.siteAdmin.password = SHA.sha256(SHA.sha256(temp), config.salt);
            }
            break;
        }
        default: {
            break;
        }
    }
    if (result <= 3) {
        updateConfig();
    }
    if (result > 0 && result <= 4) {
        await adminInfoMenu();
    } else {
        await mainMenu();
    }
};

const securityMenu = async () => {
    const result = Number(await whiptail.menu('Choose an item you want to do', {
        1: 'Enable reCAPTCHA v3',
        2: 'Set reCAPTCHA v3 site key',
        3: 'Set reCAPTCHA v3 secret key',
        4: 'Reset salt',
        5: '================================',
        6: 'Go Back',
    }));
    switch (result) {
        case 1: {
            config.reCAPTCHA.enabled = await whiptail.yesno('Enable reCAPTCHA v3?');
            break;
        }
        case 2: {
            await setValue(config.reCAPTCHA, 'siteKey', 'Input your reCAPTCHA v3 site key');
            break;
        }
        case 3: {
            await setValue(config.reCAPTCHA, 'secretKey', 'Input your reCAPTCHA v3 secret key');
            break;
        }
        case 4: {
            if (!await whiptail.yesno(`Are you sure? If you reset the salt, you will have to reset them too:

- Admin Password
- API Key`)) {
                break;
            }
            config.salt = generateSalt(32);
            const temp = await setAdminPassword();
            if (temp !== null) {
                config.siteAdmin.password = SHA.sha256(SHA.sha256(temp), config.salt);
            }
            await generateAPIKey();
            break;
        }
        default: {
            break;
        }
    }
    if (result <= 4) {
        updateConfig();
    }
    if (result > 0 && result <= 5) {
        await securityMenu();
    } else {
        await mainMenu();
    }
};

const apiMenu = async () => {
    const result = Number(await whiptail.menu('Choose an item you want to do', {
        1: 'Enable && Generate new key',
        2: 'Disable',
        3: '============================',
        4: 'Go Back',
    }));
    switch (result) {
        case 1: {
            await generateAPIKey();
            updateConfig();
            break;
        }
        case 2: {
            config.apiKey = null;
            await whiptail.msgbox('Disabled.');
            updateConfig();
            break;
        }
        default: {
            break;
        }
    }
    if (result > 0 && result <= 3) {
        await apiMenu();
    } else {
        await mainMenu();
    }
};

module.exports = (async (userPath = process.cwd()) => {
    computedPath = path.resolve(process.cwd(), userPath);
    config = fs.readJSONSync(path.join(computedPath, 'config.json'), { encoding: 'utf8' });
    await mainMenu();
});

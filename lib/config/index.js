/* eslint-disable no-use-before-define */
/* eslint-disable no-await-in-loop */

const fs = require('fs-extra');
const path = require('path');
const Whiptail = require('whiptail');
const SHA = require('../utils/sha');

const whiptail = new Whiptail({ notags: true });
let config;
let computedPath;

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
    // TODO: 替换成 passwordbox 一类的东西
    let result;
    do {
        result = await whiptail.inputbox('Input new password', '');
    } while (result !== null && !(await checkAdminPassword(result)));
    return result;
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
        3: 'Email',
        4: 'Security',
        5: 'Webhook',
        6: 'API Keys',
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
        5: '====================',
        6: 'Go Back',
    }));
    switch (result) {
        case 1: {
            config.apiHost = await whiptail.inputbox('Input hostname', config.apiHost);
            break;
        }
        case 2: {
            config.apiPort = Number(await whiptail.inputbox('Input port', config.apiPort));
            break;
        }
        case 3: {
            config.siteName = await whiptail.inputbox('Input website name', config.siteName);
            break;
        }
        case 4: {
            config.siteURL = await whiptail.inputbox('Input website URL', config.siteURL);
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
            config.siteAdmin.name = await whiptail.inputbox('Input nickname', config.siteAdmin.name);
            break;
        }
        case 2: {
            config.siteAdmin.email = await whiptail.inputbox('Input email address', config.siteAdmin.email);
            break;
        }
        case 3: {
            const temp = await setAdminPassword();
            if (temp !== null) {
                config.siteAdmin.password = SHA.sha256(temp + config.salt);
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

module.exports = (async (userPath = process.cwd()) => {
    computedPath = path.resolve(process.cwd(), userPath);
    config = fs.readJSONSync(path.join(computedPath, 'config.json'), { encoding: 'utf8' });
    await mainMenu();
});
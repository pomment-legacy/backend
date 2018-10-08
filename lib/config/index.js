/* eslint-disable no-use-before-define */
/* eslint-disable no-await-in-loop */

const fs = require('fs-extra');
const path = require('path');
const Whiptail = require('whiptail');

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
        await whiptail.msgbox('Password should contain at least any of two '
        + 'uppercase letters, lowercase letters, numbers, and symbols.');
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
    if (result <= 5) {
        await siteInfoMenu();
    } else if (result === 6) {
        await mainMenu();
    } else {
        process.exit(0);
    }
};

module.exports = (async (userPath = process.cwd()) => {
    computedPath = path.resolve(process.cwd(), userPath);
    config = fs.readJSONSync(path.join(computedPath, 'config.json'), { encoding: 'utf8' });
    const result = await setAdminPassword();
    await whiptail.msgbox(`密码是 ${result}`);
    await mainMenu();
});

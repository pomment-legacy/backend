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
        case 3: {
            await emailMenu();
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

const emailMenu = async () => {
    const result = Number(await whiptail.menu('Choose an item you want to edit', {
        1: 'Enable Email',
        2: 'Email notify title',
        3: 'Email receipt title',
        4: 'SMTP Configurion',
        5: 'Sender email address',
        6: '========================',
        7: 'Go Back',
    }));
    switch (result) {
        case 1: {
            const result2 = await whiptail.yesno('Enable email features?');
            config.email.enabled = typeof result2 === 'string';
            break;
        }
        case 2: {
            config.email.replyTitle = await whiptail.inputbox('Input notify title', config.email.replyTitle);
            break;
        }
        case 3: {
            config.email.receiptTitle = await whiptail.inputbox('Input receipt title', config.email.receiptTitle);
            break;
        }
        case 4: {
            config.email.transport.host = await whiptail.inputbox(
                'Input SMTP hostname', config.email.transport.host,
            );
            config.email.transport.port = await whiptail.inputbox(
                'Input SMTP port', config.email.transport.port,
            );
            config.email.transport.auth.user = await whiptail.inputbox(
                'Input SMTP username', config.email.transport.auth.user,
            );
            config.email.transport.auth.pass = await whiptail.inputbox(
                'Input SMTP password', config.email.transport.auth.pass,
            );
            config.email.transport.secure = typeof (await whiptail.yesno('Is this SMTP connection secure?')) === 'string';
            break;
        }
        case 5: {
            config.email.sender = await whiptail.inputbox('Input sender email address', config.email.sender);
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
        await emailMenu();
    } else {
        await mainMenu();
    }
};

const securityMenu = () => {

};

module.exports = (async (userPath = process.cwd()) => {
    computedPath = path.resolve(process.cwd(), userPath);
    config = fs.readJSONSync(path.join(computedPath, 'config.json'), { encoding: 'utf8' });
    await mainMenu();
});

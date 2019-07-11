/* eslint-disable no-use-before-define */
/* eslint-disable no-await-in-loop */

const childProcess = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const log4js = require('log4js');
const nodemailer = require('nodemailer');
const whiptail = require('../whiptail');
const safeRequire = require('../utils/safe-require');

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

const testSMTP = async () => {
    if (await whiptail.yesno(`Send a test email to ${config.siteAdmin.email}?`)) {
        const transporter = nodemailer.createTransport({
            host: config.guestNotify.smtpHost,
            port: config.guestNotify.smtpPort,
            secure: config.guestNotify.smtpSecure,
            auth: {
                user: config.guestNotify.smtpUsername,
                pass: config.guestNotify.smtpPassword,
            },
        });
        try {
            const info = await transporter.sendMail({
                from: config.guestNotify.smtpSender,
                to: config.siteAdmin.email,
                subject: 'Pomment SMTP Config Test',
                text: 'Hello world!',
                html: '<b>Hello</b> world!',
            });
            await whiptail.msgbox(`Message sent: ${info.messageId}`);
        } catch (e) {
            await whiptail.msgbox(`Failed to sent email: ${e}`);
        }
    }
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
        3: 'Guest Notification',
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
        case 3: {
            await guestNotificationMenu();
            break;
        }
        case 4: {
            await securityMenu();
            break;
        }
        case 5: {
            await webhookMenu();
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

const guestNotificationMenu = async () => {
    const result = Number(await whiptail.menu('Choose an item you want to do', {
        1: 'Set notification type',
        2: 'Edit SMTP config',
        3: 'Edit email title',
        4: 'Edit email template',
        5: 'Send test email',
        6: '=========================',
        7: 'Go Back',
    }));
    switch (result) {
        case 1: {
            await setNotificationType();
            break;
        }
        case 2: {
            await setValue(config.guestNotify, 'smtpSender', 'Input the mail sender (eg. "Alice" <foo@example.com>)');
            await setValue(config.guestNotify, 'smtpHost', 'Input your SMTP hostname');
            await setValue(config.guestNotify, 'smtpPort', 'Input your SMTP port', Number);
            await setValue(config.guestNotify, 'smtpUsername', 'Input your SMTP username');
            await setValue(config.guestNotify, 'smtpPassword', 'Input your SMTP password');
            config.guestNotify.smtpSecure = await whiptail.yesno('Is your SMTP connection secure?');
            break;
        }
        case 3: {
            await setValue(config.guestNotify, 'title', 'Input your email title');
            break;
        }
        case 4: {
            await editFile(path.join(computedPath, 'mail_notify.html'), 'email template', 'HTML is allowed.');
            break;
        }
        case 5: {
            await testSMTP();
            break;
        }
        default: {
            break;
        }
    }
    if (result <= 3) {
        updateConfig();
    }
    if (result > 0 && result <= 5) {
        await guestNotificationMenu();
    } else {
        await mainMenu();
    }
};

const setNotificationType = async () => {
    const result = Number(await whiptail.menu('Choose an type', {
        1: 'Disabled',
        2: 'Send email via SMTP',
        3: 'Send email via custom provider',
        5: '=========================',
        6: 'Go Back',
    }));
    if (result >= 1 && result <= 3) {
        if (result === 3) {
            const requireTest = safeRequire(path.resolve(computedPath, 'mail_provider'));
            if (requireTest === null) {
                await whiptail.msgbox('Your custom mail provider module is not ready. Please re-check before enabling.');
            } else {
                config.guestNotify.mode = 2;
                updateConfig();
            }
        } else {
            config.guestNotify.mode = result - 1;
            updateConfig();
        }
    }
    await guestNotificationMenu();
};

const securityMenu = async () => {
    const result = Number(await whiptail.menu('Choose an item you want to do', {
        1: 'Enable reCAPTCHA v3',
        2: 'Set reCAPTCHA v3 site key',
        3: 'Set reCAPTCHA v3 secret key',
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
        default: {
            break;
        }
    }
    if (result <= 3) {
        updateConfig();
    }
    if (result > 0 && result <= 4) {
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
const webhookMenu = async () => {
    const result = Number(await whiptail.menu('Choose an item you want to do', {
        1: 'Edit list',
        2: 'Set/Unset password',
        3: '============================',
        4: 'Go Back',
    }));
    switch (result) {
        case 1: {
            await editFile(path.join(computedPath, 'webhooks.txt'), 'webhook list', 'You may define several webhook URLs in the list file, one URL per line.');
            break;
        }
        case 2: {
            const hmac = crypto.createHmac('sha256', 'P0mm1nt_webhook');
            const val = await whiptail.inputbox('Input your webhook password. Leave blank to disable password sending.', '');
            if (val) {
                config.webhookPassword = hmac.update(val).digest('hex');
            } else {
                config.webhookPassword = null;
            }
            updateConfig();
            break;
        }
        default: {
            break;
        }
    }
    if (result > 0 && result <= 3) {
        await webhookMenu();
    } else {
        await mainMenu();
    }
};

module.exports = (async (userPath = process.cwd()) => {
    computedPath = path.resolve(process.cwd(), userPath);
    config = fs.readJSONSync(path.join(computedPath, 'config.json'), { encoding: 'utf8' });
    await mainMenu();
});

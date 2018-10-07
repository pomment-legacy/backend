/* eslint-disable no-use-before-define */

const fs = require('fs-extra');
const path = require('path');
const Whiptail = require('whiptail');

const whiptail = new Whiptail({ notags: true });
let config;
let computedPath;

const updateConfig = () => {
    fs.writeJSONSync(path.join(computedPath, 'config.json'), config, {
        spaces: 4,
    });
};

const mainMenu = async () => {
    const result = await whiptail.menu('Choose an category you want to edit', {
        0: 'Site Information',
        1: 'Admin',
        2: 'Email',
        3: 'Security',
        4: 'Webhook',
        5: 'API Keys',
    });
    switch (Number(result)) {
        case 0: {
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
        0: 'Hostname',
        1: 'Port',
        2: 'Website Name',
        3: 'Website URL',
        4: '====================',
        5: 'Go Back',
    }));
    switch (result) {
        case 0: {
            config.apiHost = await whiptail.inputbox('Input hostname', config.apiHost);
            break;
        }
        case 1: {
            config.apiPort = Number(await whiptail.inputbox('Input port', config.apiPort));
            break;
        }
        case 2: {
            config.siteName = await whiptail.inputbox('Input website name', config.siteName);
            break;
        }
        case 3: {
            config.siteURL = await whiptail.inputbox('Input website URL', config.siteURL);
            break;
        }
        default: {
            break;
        }
    }
    if (result <= 3) {
        updateConfig();
        await siteInfoMenu();
    } else if (result === 4) {
        await siteInfoMenu();
    } else {
        await mainMenu();
    }
};

module.exports = (async (userPath = process.cwd()) => {
    computedPath = path.resolve(process.cwd(), userPath);
    config = fs.readJSONSync(path.join(computedPath, 'config.json'), { encoding: 'utf8' });
    await mainMenu();
});

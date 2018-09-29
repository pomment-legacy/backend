const fs = require('fs-extra');
const path = require('path');
const Sequelize = require('sequelize');
const structThread = require('./define/structThread');

class Pomment {
    static init(workingDir) {
        return new Promise(async (resolve, reject) => {
            fs.mkdirpSync(path.join(workingDir, 'threads'));
            const indexDBPath = path.resolve(workingDir, 'index.db');
            const sequelize = new Sequelize('main', null, null, {
                dialect: 'sqlite',
                storage: indexDBPath,
                operatorsAliases: false,
            });
            sequelize.define('thread', structThread);
            await sequelize.sync({ force: true }).catch((e) => {
                reject(e);
                return false;
            });
            resolve(new Pomment(workingDir));
        });
    }

    constructor(workingDir) {
        this.workingDir = workingDir;
    }
}

module.exports = Pomment;

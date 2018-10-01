const fs = require('fs-extra');
const path = require('path');
const Sequelize = require('sequelize');

const SHA = require('../utils/sha');
const structPost = require('./define/structPost');
const structThread = require('./define/structThread');

class PommentData {
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
            resolve(new PommentData(workingDir));
        });
    }

    constructor(workingDir) {
        this._ormThread = null;
        this.workingDir = workingDir;
    }

    init() {
        const indexDBPath = path.resolve(this.workingDir, 'index.db');
        this._ormThread = new Sequelize('main', null, null, {
            dialect: 'sqlite',
            storage: indexDBPath,
            operatorsAliases: false,
        });
        this._ormThread.define('thread', structThread);
    }

    getThreadPath(url) {
        return path.join(this.workingDir, 'threads', `${SHA.sha256(url)}.db`);
    }

    getPosts(url, {
        outputEmailHash = false,
        includeHidden = false,
    } = {}) {
        return new Promise(async (resolve, reject) => {
            const sequelize = new Sequelize('main', null, null, {
                dialect: 'sqlite',
                storage: this.getThreadPath(url),
                operatorsAliases: false,
            });
            const posts = sequelize.define('posts', structPost);
            const content = [];
            const tmpContent = await posts.findAll({
                attributes: ['name', 'email', 'website', 'content', 'parent', 'hidden', 'byAdmin'],
                where: includeHidden ? {} : { hidden: false },
            }).catch((e) => {
                reject(e);
                return false;
            });
            for (let i = 0; i < tmpContent.length; i += 1) {
                const dataPointer = tmpContent[i].dataValues;
                if (outputEmailHash) {
                    dataPointer.emailHashed = SHA.md5(dataPointer.email);
                    delete dataPointer.email;
                }
                content.push(dataPointer);
            }
            resolve(content);
        });
    }

    addPost(url, name, email, website, parent, byAdmin, hidden = false) {
        return new Promise(async (resolve, reject) => {
            const sequelize = new Sequelize('main', null, null, {
                dialect: 'sqlite',
                storage: this.getThreadPath(url),
                operatorsAliases: false,
            });
            const posts = sequelize.define('posts', structPost);
        });
    }

    get ormThreadReady() {
        return !!this._ormThread;
    }
}

module.exports = PommentData;

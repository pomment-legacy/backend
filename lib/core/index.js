const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
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
            const posts = sequelize.define('post', structPost);
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
            console.log(content);
            resolve(content);
        });
    }

    addPost(
        url,
        name,
        email,
        website,
        content,
        parent = -1,
        receiveEmail,
        byAdmin,
        hidden = false,
    ) {
        return new Promise(async (resolve, reject) => {
            const storage = this.getThreadPath(url);
            const editKey = crypto.randomBytes(8).toString('hex');
            const sequelize = new Sequelize('main', null, null, {
                dialect: 'sqlite',
                storage,
                operatorsAliases: false,
            });
            const posts = sequelize.define('post', structPost);
            if (!fs.existsSync(storage)) {
                await sequelize.sync({ force: true }).catch((e) => {
                    reject(e);
                });
            }
            const queryContent = {
                name,
                email,
                website,
                parent,
                content,
                hidden,
                byAdmin,
                receiveEmail,
                editKey,
            };
            await posts.create(queryContent).catch((e) => {
                reject(e);
            });
        });
    }

    get ormThreadReady() {
        return !!this._ormThread;
    }
}

module.exports = PommentData;

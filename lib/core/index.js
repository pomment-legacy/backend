const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const Sequelize = require('sequelize');

const wipeInvalid = require('../utils/wipe_invalid');
const SHA = require('../utils/sha');
const structPost = require('./define/structPost');
const structThread = require('./define/structThread');

/**
 * Pomment 数据实例
 */
class PommentData {
    /**
     * 初始化一个 Pomment 数据实例文件夹
     * @param {string} workingDir - 工作目录
     */
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

    /**
     * 构建 Pomment 数据实例
     * @param {string} workingDir - 已有的工作目录
     */
    constructor(workingDir) {
        this._ormThread = null;
        this.workingDir = workingDir;
    }

    /**
     * 获取一个评论串的操作模型
     * @param {string} url - 评论串对应的页面地址
     * @returns {Model}
     * @private
     */
    _getPostsORM(url) {
        const sequelize = new Sequelize('main', null, null, {
            dialect: 'sqlite',
            storage: this.getThreadPath(url),
            operatorsAliases: false,
        });
        return sequelize.define('post', structPost);
    }

    /**
     * 初始化 Pomment 主题列表 ORM 对象
     * @returns {undefined}
     */
    initORMThread() {
        const indexDBPath = path.resolve(this.workingDir, 'index.db');
        this._ormThread = new Sequelize('main', null, null, {
            dialect: 'sqlite',
            storage: indexDBPath,
            operatorsAliases: false,
        });
        this._ormThread.define('thread', structThread);
    }

    /**
     * 获得评论串 SQL 文件的所在位置
     * @param {string} url - 评论串对应的页面地址
     */
    getThreadPath(url, position = 'threads', ext = 'db') {
        return path.join(this.workingDir, position, `${SHA.sha256(url)}.${ext}`);
    }

    /**
     * @typedef {Object} ThreadItem
     * @property {string} url - 评论串对应的页面地址
     * @property {string} title - 评论串对应的页面的标题
     */
    /**
     * 获得已有的评论串列表
     * @returns {Promise<ThreadItem[]>} 评论串列表
     */
    getThreads() {
        return new Promise(async (resolve, reject) => {
            if (!this._ormThread) {
                this.initORMThread();
            }
            const content = [];
            const tmpContent = await this._ormThread.findAll().catch((e) => {
                reject(e);
                return false;
            });
            for (let i = 0; i < tmpContent.length; i += 1) {
                const dataPointer = tmpContent[i].dataValues;
                content.push(dataPointer);
            }
            resolve(content);
        });
    }

    /**
     * @typedef {Object} PostItem
     * @property {number} id - 评论在数据库的 ID
     * @property {string} name - 评论者的昵称
     * @property {string} email - 评论者的电子邮件地址
     * @property {string} website - 评论者的个人主页
     * @property {string} content - 评论内容
     * @property {number} parent - 要回复的其它评论
     * @property {boolean} [hidden] - 这篇评论是否被隐藏。当 includeHidden 没有被指定或为 false 时，该值不会被指定
     * @property {boolean} byAdmin - 这篇评论是否由管理员提交
     * @property {Date} createdAt 评论的提交时间
     */
    /**
     * 获得一个评论串的所有评论
     * @param {string} url - 评论串对应的页面地址
     * @param {boolean} outputEmailHash - 输出电子邮件地址的 MD5 值而非原文
     * @param {boolean} includeHidden - 包括被隐藏的评论
     * @returns {Promise<PostItem[]>} 评论列表
     */
    getPosts(url, {
        outputEmailHash = false,
        includeHidden = false,
    } = {}) {
        return new Promise(async (resolve, reject) => {
            const attributes = ['id', 'name', 'email', 'website', 'content', 'parent', 'byAdmin', 'createdAt'];
            if (includeHidden) {
                attributes.push('hidden');
            }

            const posts = this._getPostsORM(url);
            const content = [];
            const tmpContent = await posts.findAll({
                attributes,
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

    /**
     * 获得一个评论串的其中一篇评论
     * @param {string} url - 评论串对应的页面地址
     * @param {number} id - 评论在数据库中的 ID
     * @param {boolean} includeHidden - 包括被隐藏的评论
     * @returns {Promise<PostItem>} 评论
     */
    getPostsSingle(url, id, {
        includeHidden = false,
    } = {}) {
        return new Promise(async (resolve, reject) => {
            const attributes = ['id', 'name', 'email', 'website', 'content', 'parent', 'byAdmin', 'createdAt'];
            if (includeHidden) {
                attributes.push('hidden');
            }

            const posts = this._getPostsORM(url);
            const content = await posts.find({
                attributes,
                where: includeHidden ? {} : { hidden: false },
            }).catch((e) => {
                reject(e);
                return false;
            });
            resolve(content.dataValues);
        });
    }

    /**
     * @typedef {Object} PostResults
     * @property {number} id - 评论在数据库的 ID
     * @property {string} name - 评论者的昵称
     * @property {string} email - 评论者的电子邮件地址
     * @property {string} website - 评论者的个人主页
     * @property {number} parent - 要回复的其它评论
     * @property {string} content - 评论内容
     * @property {boolean} hidden - 这篇评论是否被隐藏
     * @property {boolean} byAdmin - 这篇评论是否由管理员提交
     * @property {boolean} receiveEmail - 是否接收邮件提醒
     * @property {string} editKey - 编辑 / 删除评论所需的密钥
     * @property {Date} updatedAt 评论的最后更新时间
     * @property {Date} createdAt 评论的提交时间
     */

    /**
     * 添加评论
     * @param {string} url - 评论串对应的页面地址
     * @param {string} name - 评论者的昵称
     * @param {string} email - 评论者的电子邮件地址
     * @param {string} website - 评论者的个人主页
     * @param {string} content - 评论内容
     * @param {number} [parent] - 要回复的其它评论
     * @param {boolean} receiveEmail - 是否接收邮件提醒
     * @param {boolean} byAdmin - 这篇评论是否由管理员提交
     * @param {boolean} [hidden] - 这篇评论是否被隐藏
     * @returns {Promise<PostResults>} - 评论结果回执
     */
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
        {
            verifyLocked = false,
        } = {},
    ) {
        return new Promise(async (resolve, reject) => {
            if (verifyLocked) {
                if (fs.existsSync(this.getThreadPath(url, undefined, 'lock'))) {
                    reject(new Error('Thread locked'));
                    return false;
                }
            }
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
            const result = await posts.create(queryContent).catch((e) => {
                reject(e);
            });
            console.log(result);
            resolve(result.dataValues);
            return true;
        });
    }

    /**
     * 编辑一篇评论
     * @param {string} url - 评论串对应的页面地址
     * @param {number} id - 评论在数据库的 ID
     * @param {string} name - 评论者的昵称
     * @param {string} email - 评论者的电子邮件地址
     * @param {string} website - 评论者的个人主页
     * @param {number} parent - 要回复的其它评论
     * @param {string} content - 评论内容
     * @param {boolean} hidden - 这篇评论是否被隐藏
     * @param {boolean} byAdmin - 这篇评论是否由管理员提交
     * @param {boolean} receiveEmail - 是否接收邮件提醒
     * @param {string} editKey - 编辑 / 删除评论所需的密钥
     * @returns {Promise<undefined>}
     */
    editPost(url, id, {
        name, email, website, parent, content, hidden, byAdmin, receiveEmail, editKey,
    } = {}, {
        verifyLocked = false,
    } = {}) {
        return new Promise(async (resolve, reject) => {
            if (verifyLocked) {
                if (fs.existsSync(this.getThreadPath(url, undefined, 'lock'))) {
                    reject(new Error('Thread locked'));
                    return false;
                }
            }
            const updatedAttr = {
                name, email, website, parent, content, hidden, byAdmin, receiveEmail, editKey,
            };
            wipeInvalid(updatedAttr);
            const posts = this._getPostsORM(url);
            await posts.update(updatedAttr, {
                where: {
                    id,
                },
            }).catch((e) => {
                reject(e);
            });
            resolve();
            return true;
        });
    }

    /**
     * 用户编辑 / 删除一篇评论
     * @param url - 评论串对应的页面地址
     * @param id - 评论在数据库的 ID
     * @param content - 评论内容
     * @param remove - 是否删除评论
     * @returns {Promise<undefined>}
     */
    editPostUser(url, id, content, editKey, remove = false) {
        return new Promise(async (resolve, reject) => {
            const updatedAttr = {};
            if (remove) {
                updatedAttr.hidden = true;
            } else {
                updatedAttr.content = content;
            }
            const posts = this._getPostsORM(url);
            const verifyInfo = await posts.find({
                attributes: ['editKey'],
                where: {
                    id,
                },
            }).catch((e) => {
                reject(e);
            });
            if (verifyInfo.dataValues.editKey !== editKey) {
                reject(new Error('Permission denied'));
                return false;
            }
            await posts.update(updatedAttr, {
                where: {
                    id,
                },
            }).catch((e) => {
                reject(e);
            });
            resolve();
            return true;
        });
    }

    /**
     * 将一个评论串移动到回收站
     * @param url - 评论串对应的页面地址
     * @returns {Promise<undefined>}
     */
    trashThread(url) {
        return new Promise(async (resolve, reject) => {
            if (!this.ormThreadReady) {
                this.initORMThread();
            }
            await this._ormThread.destroy({
                force: true,
                where: {
                    url,
                },
            }).catch((e) => {
                reject(e);
            });
            fs.mkdirpSync(path.join(this.workingDir, 'trashes'));
            if (fs.existsSync(this.getThreadPath(url))) {
                fs.moveSync(this.getThreadPath(url), this.getThreadPath(url, 'trashes'));
            }
            if (fs.existsSync(this.getThreadPath(url, undefined, 'lock'))) {
                fs.moveSync(this.getThreadPath(url, undefined, 'lock'), this.getThreadPath(url, 'trashes', 'lock'));
            }
            resolve();
        });
    }

    /**
     * 评论串列表的 ORM 对象是否已经加载
     * @returns {boolean} - 是否已经加载
     */
    get ormThreadReady() {
        return !!this._ormThread;
    }
}

module.exports = PommentData;

const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const Sequelize = require('sequelize');

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
    getThreadPath(url) {
        return path.join(this.workingDir, 'threads', `${SHA.sha256(url)}.db`);
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

            const sequelize = new Sequelize('main', null, null, {
                dialect: 'sqlite',
                storage: this.getThreadPath(url),
                operatorsAliases: false,
            });
            const posts = sequelize.define('post', structPost);
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
            const result = await posts.create(queryContent).catch((e) => {
                reject(e);
            });
            resolve(result.dataValues);
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
    } = {}) {
        return new Promise(async (resolve, reject) => {
            const updatedAttr = {
                name, email, website, parent, content, hidden, byAdmin, receiveEmail, editKey,
            };
            const storage = this.getThreadPath(url);
            const sequelize = new Sequelize('main', null, null, {
                dialect: 'sqlite',
                storage,
                operatorsAliases: false,
            });
            const posts = sequelize.define('post', structPost);
            await posts.update(updatedAttr, {
                where: {
                    id,
                },
            }).catch((e) => {
                reject(e);
            });
            resolve();
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
    editPostUser(url, id, content, remove = false) {
        return new Promise(async (resolve, reject) => {
            const updatedAttr = {};
            if (remove) {
                updatedAttr.hidden = true;
            } else {
                updatedAttr.content = content;
            }
            const storage = this.getThreadPath(url);
            const sequelize = new Sequelize('main', null, null, {
                dialect: 'sqlite',
                storage,
                operatorsAliases: false,
            });
            const posts = sequelize.define('post', structPost);
            await posts.update(updatedAttr, {
                where: {
                    id,
                },
            }).catch((e) => {
                reject(e);
            });
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

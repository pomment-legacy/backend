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
 * @typedef {Object} ThreadAttribute
 * @property {string} title - 标题
 */

/**
 * @typedef {Object} ThreadItem
 * @property {string} url - 评论串对应的页面地址
 * @property {ThreadAttribute} attributes - 评论串的属性
 */

const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const log4js = require('log4js');

const MapFromFile = require('../utils/map');
const SHA = require('../utils/sha');
const wipeInvalid = require('../utils/wipe_invalid');

const logger = log4js.getLogger('PommentData');
logger.level = process.env.NODE_ENV === 'development' ? 'debug' : 'info';
/**
 * Pomment 数据实例
 */
class PommentData {
    /**
     * 初始化一个 Pomment 数据实例文件夹
     * @param {string} workingDir - 工作目录
     */
    static async init(workingDir) {
        fs.mkdirpSync(path.join(workingDir, 'threads'));
        fs.writeFileSync(path.join(workingDir, 'index.json'), '[]\n', { encoding: 'utf8' });
        return new PommentData(workingDir);
    }

    /**
     * 构建 Pomment 数据实例
     * @param {string} workingDir - 已有的工作目录
     */
    constructor(workingDir) {
        this.workingDir = workingDir;
        this._indexMap = new MapFromFile(path.join(workingDir, 'index.json'), 'url', 'attributes');
    }

    /**
     * 获得评论串 SQL 文件的所在位置
     * @param {string} url - 评论串对应的页面地址
     */
    getThreadPath(url, position = 'threads', ext = 'json') {
        const newURL = encodeURIComponent(url)
        /*
            .replace(/</g, '%3C')
            .replace(/>/g, '%3E')
            .replace(/:/g, '%3A')
            .replace(/"/g, '%22')
            .replace(/\//g, '%2F')
            .replace(/\\/g, '%5C')
            .replace(/\|/g, '%7C')
            .replace(/\?/g, '%3F')
        */
            .replace(/\*/g, '%2A');
        let newName = `${newURL}.${ext}`;
        if (newName.length > 255) {
            newName = newName.slice(newName.length - 255);
        }
        return path.join(this.workingDir, position, newName);
    }

    /**
     * 获得已有的评论串列表
     * @returns {ThreadItem[]} 评论串列表
     */
    getThreads() {
        return this._indexMap.toReadableObject();
    }

    /**
     * 获得某个评论串的属性
     * @returns {ThreadAttribute} 评论串的属性
     */
    getThreadAttribute(url) {
        return this._indexMap.get(url);
    }

    /**
     * 增加一个评论串的数据
     * @param {string} url - 评论串对应的页面地址
     * @param {string} title - 评论串对应的页面的标题
     */
    addThreadTitle(url, title, override = false) {
        if (!override && this._indexMap.has(url)) {
            return false;
        }
        this._indexMap.setAndSave(url, { title });
        return true;
    }

    /**
     * 获得一个评论串的所有评论
     * @param {string} url - 评论串对应的页面地址
     * @param {boolean} outputEmailHash - 输出电子邮件地址的 MD5 值而非原文
     * @param {boolean} includeHidden - 包括被隐藏的评论
     * @returns {Promise<PostItem[]>} 评论列表
     */
    async getPosts(url, {
        outputEmailHash = false,
        includeHidden = false,
    } = {}) {
    }

    /**
     * 获得一个评论串的其中一篇评论
     * @param {string} url - 评论串对应的页面地址
     * @param {number} id - 评论在数据库中的 ID
     * @param {boolean} includeHidden - 包括被隐藏的评论
     * @returns {Promise<PostItem>} 评论
     */
    async getPost(url, id, {
        includeHidden = false,
    } = {}) {
    }

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
    async addPost(
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
    async editPost(url, id, {
        name, email, website, parent, content, hidden, byAdmin, receiveEmail, editKey,
    } = {}, {
        verifyLocked = false,
    } = {}) {
    }

    /**
     * 用户编辑 / 删除一篇评论
     * @param url - 评论串对应的页面地址
     * @param id - 评论在数据库的 ID
     * @param content - 评论内容
     * @param remove - 是否删除评论
     * @returns {Promise<undefined>}
     */
    async editPostUser(url, id, content, editKey, remove = false) {
    }

    /**
     * 获得一个评论串的锁定状态
     * @param {string} url - 评论串对应的页面地址
     * @returns {boolean} 是否已经锁定
    */
    getThreadLock(url) {
        const lockPath = this.getThreadPath(url, undefined, 'lock');
        return fs.existsSync(lockPath);
    }

    /**
     * 设置一个评论串的锁定状态
     * @param {string} url - 评论串对应的页面地址
     * @param {boolean} locked - 锁定状态
     */
    setThreadLock(url, locked) {
        const lockPath = this.getThreadPath(url, undefined, 'lock');
        if (fs.existsSync(lockPath)) {
            if (!locked) {
                fs.unlinkSync(lockPath);
            }
        } else if (locked) {
            fs.writeFileSync(lockPath, '');
        }
    }

    /**
     * 将一个评论串移动到回收站
     * @param url - 评论串对应的页面地址
     */
    trashThread(url) {
        this._indexMap.deleteAndSave(url);
        fs.mkdirpSync(path.join(this.workingDir, 'trashes'));
        if (fs.existsSync(this.getThreadPath(url))) {
            fs.moveSync(this.getThreadPath(url), this.getThreadPath(url, 'trashes'));
        }
        if (fs.existsSync(this.getThreadPath(url, undefined, 'lock'))) {
            fs.moveSync(this.getThreadPath(url, undefined, 'lock'), this.getThreadPath(url, 'trashes', 'lock'));
        }
    }
}

module.exports = PommentData;

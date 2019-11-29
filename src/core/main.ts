import crypto from 'crypto';
import fs from 'fs-extra';
import log4js from "log4js";
import path from 'path';

import MapFromFile from "../lib/map";
import SHA from "../lib/sha";
import wipeInvalid from "../lib/wipe_invalid";

const fsOpts = { encoding: "utf8" };
const logger = log4js.getLogger("PommentData");
logger.level = process.env.NODE_ENV === "development" ? "debug" : "info";

const toTimeStamp = (str) => new Date(str).getTime();

/**
 * Pomment 数据实例
 */
class PommentData {
    /**
     * 初始化一个 Pomment 数据实例文件夹
     */
    public static async init(workingDir: string) {
        fs.mkdirpSync(path.join(workingDir, "threads"));
        fs.writeFileSync(path.join(workingDir, "index.json"), "[]\n", fsOpts);
        return new PommentData(workingDir);
    }

    /**
     * 构建 Pomment 数据实例
     * @param {string} workingDir - 已有的工作目录
     */
    constructor(workingDir) {
        this.workingDir = workingDir;
        this._indexMap = new MapFromFile(path.join(workingDir, "index.json"), "url", "attributes");
    }

    /**
     * 获得评论串 JSON 文件的所在位置
     * @param {string} url - 评论串对应的页面地址
     */
    public getThreadPath(url, position = "threads", ext = "json") {
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
            .replace(/\*/g, "%2A");
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
    public getThreads() {
        return this._indexMap.toReadableObject();
    }

    /**
     * 获得某个评论串的属性
     * @returns {ThreadAttribute} 评论串的属性
     */
    public getThreadAttribute(url) {
        return this._indexMap.get(url);
    }

    /**
     * 增加一个评论串的数据
     * @param {string} url - 评论串对应的页面地址
     * @param {string} title - 评论串对应的页面的标题
     */
    public addThreadTitle(url, title, override = false) {
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
     * @returns {Promise<PostItem[]>} 评论列表
     */
    public async getPosts(url, {
        outputEmailHash = false,
    } = {}) {
        const content = await fs.readJSON(this.getThreadPath(url), fsOpts);
        const filtered = content.filter((e) => {
            if (e.hidden) {
                return false;
            }
            return true;
        });
        for (let i = 0; i < filtered.length; i += 1) {
            if (outputEmailHash) {
                filtered[i].emailHashed = filtered[i].email ? SHA.md5(filtered[i].email) : null;
                delete filtered[i].email;
            }
            filtered[i].edited = (toTimeStamp(filtered[i].createdAt) < toTimeStamp(filtered[i].updatedAt));
            delete filtered[i].origContent;
            delete filtered[i].receiveEmail;
            delete filtered[i].hidden;
            delete filtered[i].editKey;
            delete filtered[i].rating;
        }
        return filtered;
    }

    /**
     * 获得一个评论串的其中一篇评论
     * @param {string} url - 评论串对应的页面地址
     * @param {number} id - 评论在数据库中的 ID
     * @returns {Promise<PostItem>} 评论
     */
    public async getPost(url, id) {
        const content = await fs.readJSON(this.getThreadPath(url), fsOpts);
        while (content.length > 0) {
            const temp = content.pop();
            if (temp.id === id) {
                if (temp.hidden) {
                    return null;
                }
                return temp;
            }
        }
        return null;
    }

    /**
     * 添加评论
     * @param {string} url - 评论串对应的页面地址
     * @param {string} name - 评论者的昵称
     * @param {string} email - 评论者的电子邮件地址
     * @param {string} website - 评论者的个人主页
     * @param {string} content - 评论内容
     * @param {number} rating - 此评论的 reCAPTCHA v3 评分
     * @param {number} [parent] - 要回复的其它评论
     * @param {boolean} receiveEmail - 是否接收邮件提醒
     * @param {boolean} byAdmin - 这篇评论是否由管理员提交
     * @param {boolean} [hidden] - 这篇评论是否被隐藏
     * @returns {Promise<PostResults>} - 评论结果回执
     */
    public async addPost(
        url,
        name,
        email,
        website,
        content,
        parent = -1,
        receiveEmail,
        byAdmin,
        hidden = false,
        rating = null,
        {
            verifyLocked = false,
        } = {},
    ) {
        if (verifyLocked && this.getThreadLock(url)) {
            throw new Error("This thread is already locked and verifyLocked is enabled");
        }
        let list = [];
        let id = 1;
        try {
            list = await fs.readJSON(this.getThreadPath(url), fsOpts);
        } catch (e) {
            if (e.code !== "ENOENT") {
                throw e;
            }
        }
        if (list.length > 0) {
            id = list.reduce((prev, cur) => {
                if (prev.id > cur.id) {
                    return prev;
                }
                return cur;
            }).id + 1;
        }
        const now = new Date().getTime();
        const postResults = {
            id,
            name,
            email,
            website,
            avatar: null,
            parent,
            content,
            hidden,
            rating,
            byAdmin,
            receiveEmail,
            editKey: crypto.randomBytes(8).toString("hex"),
            createdAt: now,
            updatedAt: now,
        };
        list.push(postResults);
        await fs.writeJSONSync(this.getThreadPath(url), list, { ...fsOpts, spaces: 4 });
        return postResults;
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
     * @param {string} avatar - 评论者的头像 URL 地址
     * @param {number} rating - 此评论的 reCAPTCHA v3 评分
     * @returns {Promise<undefined>}
     */
    public async editPost(url, id, {
        name, email, website, parent, content, hidden, byAdmin, receiveEmail, editKey, avatar, rating,
    } = {},        {
        verifyLocked = false,
        prevertUpdateTime = false,
    } = {}) {
        if (verifyLocked && this.getThreadLock(url)) {
            throw new Error("This thread is already locked and verifyLocked is enabled");
        }
        const list = await fs.readJSON(this.getThreadPath(url), fsOpts);
        const toUpdate = {
            name, email, website, parent, content, hidden, byAdmin, receiveEmail, editKey, avatar, rating,
        };
        let targetID = null;
        wipeInvalid(toUpdate);
        for (let i = 0; i < list.length; i += 1) {
            if (list[i].id === id) {
                targetID = i;
                break;
            }
            if (i >= list.length - 1) {
                throw new Error("The post user specified is not found");
            }
        }
        const toUpdateKeys = Object.keys(toUpdate);
        if (typeof list[targetID].origContent === "undefined") {
            list[targetID].origContent = list[targetID].content;
        }
        for (let i = 0; i < toUpdateKeys.length; i += 1) {
            list[targetID][toUpdateKeys[i]] = toUpdate[toUpdateKeys[i]];
        }
        if (!prevertUpdateTime) {
            list[targetID].updatedAt = new Date().getTime();
        }
        await fs.writeJSONSync(this.getThreadPath(url), list, { ...fsOpts, spaces: 4 });
    }

    /**
     * 用户编辑 / 删除一篇评论
     * @param url - 评论串对应的页面地址
     * @param id - 评论在数据库的 ID
     * @param content - 评论内容
     * @param remove - 是否删除评论
     * @returns {Promise<undefined>}
     */
    public async editPostUser(url, id, content, editKey, remove = false) {
        const wanted = await this.getPost(url, id, { includeHidden: false });
        if (!wanted.editKey) {
            throw new Error("Editing this post is not allowed");
        }
        if (wanted.editKey !== editKey) {
            throw new Error("Edit key is incorrect");
        }
        await this.editPost(url, id, {
            content: remove ? undefined : content,
            hidden: remove ? true : undefined,
        }, { verifyLocked: true });
    }

    /**
     * 管理员编辑 / 删除一篇评论
     * @param url - 评论串对应的页面地址
     * @param id - 评论在数据库的 ID
     * @param content - 评论内容
     * @param remove - 是否删除评论
     * @returns {Promise<undefined>}
     */
    public async editPostAdmin(url, id, content, remove = false) {
        await this.editPost(url, id, {
            content: remove ? undefined : content,
            hidden: remove ? true : undefined,
        });
    }

    /**
     * 获得一个评论串的锁定状态
     * @param {string} url - 评论串对应的页面地址
     * @returns {boolean} 是否已经锁定
    */
    public getThreadLock(url) {
        const lockPath = this.getThreadPath(url, undefined, "lock");
        return fs.existsSync(lockPath);
    }

    /**
     * 设置一个评论串的锁定状态
     * @param {string} url - 评论串对应的页面地址
     * @param {boolean} locked - 锁定状态
     */
    public setThreadLock(url, locked) {
        const lockPath = this.getThreadPath(url, undefined, "lock");
        if (fs.existsSync(lockPath)) {
            if (!locked) {
                fs.unlinkSync(lockPath);
            }
        } else if (locked) {
            fs.writeFileSync(lockPath, "");
        }
    }

    /**
     * 将一个评论串移动到回收站
     * @param url - 评论串对应的页面地址
     */
    public trashThread(url) {
        this._indexMap.deleteAndSave(url);
        fs.mkdirpSync(path.join(this.workingDir, "trashes"));
        if (fs.existsSync(this.getThreadPath(url))) {
            fs.moveSync(this.getThreadPath(url), this.getThreadPath(url, "trashes"));
        }
        if (fs.existsSync(this.getThreadPath(url, undefined, "lock"))) {
            fs.moveSync(this.getThreadPath(url, undefined, "lock"), this.getThreadPath(url, "trashes", "lock"));
        }
    }
}

module.exports = PommentData;

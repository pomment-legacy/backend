import { PommentPost, PommentSubmittedPost, PommentThreadMetadata } from '@/types/post';
import fs from 'fs-extra';
import path from 'path';
import { PommentWebError } from '@/server/utils/error';
import { v5 as uuidv5 } from 'uuid';
import crypto from 'crypto';

const textOptions = {
    encoding: 'utf8',
};

export default class PommentDataContext {
    static MAIN_UUID = '91729628-42c2-4e60-8a45-593403a3ac67';

    workingDir: string;

    indexMap: Map<string, PommentThreadMetadata>

    constructor(workingDir: string) {
        this.workingDir = workingDir;
        this.indexMap = new Map<string, PommentThreadMetadata>(fs.readJSONSync(path.join(workingDir, 'index.json'), textOptions));
    }

    static assignThreadUUID() {
        const now = +new Date();
        return uuidv5(`pomment_${now}`, PommentDataContext.MAIN_UUID);
    }

    static assignPostUUID(threadUUID: string) {
        const now = +new Date();
        return uuidv5(`pomment_${now}`, threadUUID);
    }

    static assignEditKey() {
        return crypto.randomBytes(16).toString('hex');
    }

    /**
     * 获取评论串的列表/锁文件绝对路径
     * @param url
     * @param ext
     */
    public getThreadPath(url: string, ext = 'json') {
        const newURL = encodeURIComponent(url).replace(/\*/g, '%2A');
        let newName = `${newURL}.${ext}`;
        if (newName.length > 255) {
            newName = newName.slice(newName.length - 255);
        }
        return path.join(this.workingDir, 'threads', newName);
    }

    /**
     * 获取评论串的元数据
     * @param url
     */
    public getThreadMetadata(url: string) {
        return this.indexMap.get(url);
    }

    /**
     * 获取所有评论串的元数据
     */
    public getThreadList() {
        const list = [...this.indexMap.values()];
        return list.sort((a, b) => {
            if (a.latestPostAt < b.latestPostAt) {
                return 1;
            }
            if (a.latestPostAt > b.latestPostAt) {
                return -1;
            }
            return 0;
        });
    }

    /**
     * 初始化评论串的元数据
     */
    public initThreadMetadata(url: string, title: string) {
        const args: PommentThreadMetadata = {
            uuid: PommentDataContext.assignThreadUUID(),
            title,
            url,
            firstPostAt: 0,
            latestPostAt: 0,
            amount: 0,
            hiddenAmount: 0,
        };
        this.indexMap.set(url, args);
        return args;
    }

    /**
     * 获取多条评论（未过滤）
     * @param url
     * @param options
     */
    public async getPosts(url: string, options: {
        reverse?: boolean,
        safe?: boolean,
        showAll?: boolean
    } = {}): Promise<PommentPost[]> {
        if (!fs.existsSync(this.getThreadPath(url))) {
            if (options.safe) {
                return [];
            }
            throw new PommentWebError(404);
        }
        let data: PommentPost[] = await fs.readJSON(this.getThreadPath(url), textOptions);
        if (options.reverse) {
            data = data.reverse();
        }
        if (options.showAll) {
            return data;
        }
        return data.filter((e) => !e.hidden);
    }

    /**
     * 获取一条评论（未过滤）
     */
    public async getPost(url: string, uuid: string): Promise<PommentPost> {
        const posts = await this.getPosts(url, {
            showAll: true,
        });
        const post = posts.find((e) => e.uuid === uuid);
        if (!post) {
            throw new PommentWebError(404);
        }
        return post;
    }

    /**
     * 写入多条评论（覆盖整个评论串）
     * @param url
     * @param data
     */
    public async savePosts(url: string, data: PommentPost[]) {
        await fs.writeJSON(this.getThreadPath(url), data, { ...textOptions, spaces: 4 });
    }

    /**
     * 编辑一条评论
     * @param url
     * @param uuid
     * @param data
     */
    public async setPost(url: string, uuid: string, data: PommentPost) {
        const posts = await this.getPosts(url, {
            showAll: true,
        });
        const targetId = posts.findIndex((e, i) => e?.uuid === uuid);
        if (targetId < 0) {
            throw new PommentWebError(404);
        }
        posts[targetId] = { ...data, uuid };
        await this.savePosts(url, posts);
        await this.updateCounter(url, posts);
        return posts[targetId];
    }

    /**
     * 添加一条评论
     * @param url
     * @param data
     * @param options
     */
    public async createPost(url: string, data: PommentSubmittedPost, options: {
        title?: string
    } = {}) {
        let metadata = this.getThreadMetadata(url);
        if (!metadata) {
            metadata = this.initThreadMetadata(url, options.title ?? '');
        }
        const posts = await this.getPosts(url, {
            safe: true,
            showAll: true,
        });
        const now = +new Date();
        const assignedPost: PommentPost = {
            ...data,
            createdAt: now,
            updatedAt: now,
            editKey: PommentDataContext.assignEditKey(),
            origContent: data.content,
            uuid: PommentDataContext.assignPostUUID(metadata.uuid),
        };
        posts.push(assignedPost);
        await this.savePosts(url, posts);
        await this.updateCounter(url, posts);
        return assignedPost;
    }

    /**
     * 更新计数器
     * @param url
     * @param fetchedData
     */
    public async updateCounter(url: string, fetchedData?: PommentPost[]) {
        const metadata = this.getThreadMetadata(url);
        if (!metadata) {
            throw new PommentWebError(404);
        }
        const data = fetchedData ?? await this.getPosts(url, {
            showAll: true,
        });
        const postDates = data.map((e) => e.createdAt);
        metadata.url = url;
        metadata.amount = data.filter((e) => !e.hidden).length;
        metadata.hiddenAmount = data.length - metadata.amount;
        metadata.firstPostAt = Math.min(...postDates);
        metadata.latestPostAt = Math.max(...postDates);
        this.saveThreadList();
        return metadata;
    }

    /**
     * 更新元数据
     */
    public async updateThreadMetadata(url: string, editedData: {
        title: string
    }) {
        const metadata = this.getThreadMetadata(url);
        if (!metadata) {
            throw new PommentWebError(404);
        }
        metadata.title = editedData.title;
        this.saveThreadList();
        return metadata;
    }

    /**
     * 保存评论串列表到磁盘
     * @private
     */
    private saveThreadList() {
        fs.writeJSONSync(path.join(this.workingDir, 'index.json'), [...this.indexMap], { ...textOptions, spaces: 4 });
    }
}

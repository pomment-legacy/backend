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
     * 获取多条评论（未过滤）
     * @param url
     * @param options
     */
    public async getPosts(url: string, options: {
        reverse?: boolean
    } = {}): Promise<PommentPost[]> {
        if (!fs.existsSync(this.getThreadPath(url))) {
            throw new PommentWebError(404);
        }
        const data = await fs.readJSON(this.getThreadPath(url), textOptions);
        if (options.reverse) {
            return data.reverse();
        }
        return data;
    }

    /**
     * 获取一条评论（未过滤）
     */
    public async getPost(url: string, uuid: string): Promise<PommentPost> {
        const posts = await this.getPosts(url);
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
    public async putPosts(url: string, data: PommentPost[]) {
        await fs.writeJSON(this.getThreadPath(url), data, { ...textOptions, spaces: 4 });
    }

    /**
     * 编辑一条评论
     * @param url
     * @param uuid
     * @param data
     */
    public async putPost(url: string, uuid: string, data: PommentPost) {
        const posts = await this.getPosts(url);
        const targetId = posts.findIndex((e, i) => e?.uuid === uuid);
        if (targetId < 0) {
            throw new PommentWebError(404);
        }
        posts[targetId] = { ...data, uuid };
        await this.putPosts(url, posts);
    }

    /**
     * 添加一条评论
     * @param url
     * @param data
     */
    public async createPost(url: string, data: PommentSubmittedPost) {
        const metadata = this.getThreadMetadata(url);
        if (!metadata) {
            throw new PommentWebError(404);
        }
        const posts = await this.getPosts(url);
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
        await this.putPosts(url, posts);
        return assignedPost;
    }
}

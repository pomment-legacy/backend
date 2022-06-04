import { PommentPost, PommentThreadMetadata } from '@/types/post';
import fs from 'fs-extra';
import path from 'path';
import { PommentWebError } from '@/server/utils/error';

const textOptions = {
    encoding: 'utf8',
};

export default class PommentDataContext {
    workingDir: string;

    indexMap: Map<string, PommentThreadMetadata>

    constructor(workingDir: string) {
        this.workingDir = workingDir;
        this.indexMap = new Map<string, PommentThreadMetadata>(fs.readJSONSync(path.join(workingDir, 'index.json'), textOptions));
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
     * 获取评论（未过滤）
     * @param url
     */
    public async getPosts(url: string): Promise<PommentPost[]> {
        if (!fs.existsSync(this.getThreadPath(url))) {
            throw new PommentWebError(404);
        }
        const data = await fs.readJSON(this.getThreadPath(url), textOptions);
        return data.reverse();
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
}

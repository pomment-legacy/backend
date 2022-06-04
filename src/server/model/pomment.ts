import { PommentPost, PommentThreadMetadata } from '@/types/post';
import fs from 'fs-extra';
import path from 'path';

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
    public getPosts(url: string): Promise<PommentPost[]> {
        return fs.readJSON(this.getThreadPath(url), textOptions);
    }

    /**
     * 获取一条评论（未过滤）
     */
    public async getPost(url: string, uuid: string): Promise<PommentPost | undefined> {
        const posts = await this.getPosts(url);
        return posts.find((e) => e.uuid === uuid);
    }
}

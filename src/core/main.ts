import { assert } from 'console';
import crypto from 'crypto';
import fs from 'fs-extra';
import path from 'path';
import { v5 as uuidv5 } from 'uuid';
import { IPostItem, IPostQueryResults, IThreadItem } from '../interface/post';
import SHA from '../lib/sha';
import wipeInvalid from '../lib/wipe_invalid';

const fsOpts = { encoding: 'utf8' };
const toTimeStamp = (e: number) => new Date(e).getTime();

export interface IPostEditArgs {
    // uuid: string;
    name?: string | null;
    email?: string;
    website?: string | null;
    avatar?: string | null;
    parent?: string | null;
    content?: string;
    hidden?: boolean;
    rating?: number | null;
    byAdmin?: boolean;
    receiveEmail?: boolean;
    editKey?: string | null;
    updatedAt?: number;
    createdAt?: number;
}

export interface IThreadListItem {
    title: string;
    latestPostAt: number | null;
    amount: number;
    url: string;
}

export class PommentData {
    static MAIN_UUID = '91729628-42c2-4e60-8a45-593403a3ac67';

    public workingDir: string;

    private indexMap: Map<string, IThreadItem>;

    constructor(workingDir: string) {
        this.workingDir = workingDir;
        this.indexMap = new Map<string, IThreadItem>(fs.readJSONSync(path.join(workingDir, 'index.json'), fsOpts));
    }

    public getThreadPath(url: string, position = 'threads', ext = 'json') {
        const newURL = encodeURIComponent(url).replace(/\*/g, '%2A');
        let newName = `${newURL}.${ext}`;
        if (newName.length > 255) {
            newName = newName.slice(newName.length - 255);
        }
        return path.join(this.workingDir, position, newName);
    }

    public static getThreadFileName(url: string, ext = 'json') {
        const newURL = encodeURIComponent(url).replace(/\*/g, '%2A');
        let newName = `${newURL}.${ext}`;
        if (newName.length > 255) {
            newName = newName.slice(newName.length - 255);
        }
        return newName;
    }

    public getThreadAttribute(url: string) {
        return this.indexMap.get(url);
    }

    public getThreadList() {
        const tempList: IThreadListItem[] = [];
        this.indexMap.forEach((v, k) => {
            const tempItem: IThreadListItem = {
                url: k,
                ...v,
            };
            tempList.push(tempItem);
        });
        return tempList.sort((a, b) => {
            if (a.latestPostAt === null) {
                return 1;
            }
            if (b.latestPostAt === null) {
                return -1;
            }
            return b.latestPostAt - a.latestPostAt;
        });
    }

    public async updateThreadInfo(url: string, title: string, override = false) {
        if (!override && this.indexMap.has(url)) {
            const ref = this.indexMap.get(url);
            if (ref !== undefined) {
                ref.amount = await this.getPostsAmount(url);
                ref.latestPostAt = new Date().getTime();
            }
            this.saveThreadList();
            return;
        }
        const now = new Date().getTime();
        this.indexMap.set(url, {
            uuid: uuidv5(`pomment_${now}`, PommentData.MAIN_UUID),
            title,
            amount: await this.getPostsAmount(url),
            firstPostAt: now,
            latestPostAt: now,
        });
        this.saveThreadList();
    }

    public async getPosts(url: string) {
        const data: IPostQueryResults[] = await fs.readJSON(this.getThreadPath(url), fsOpts);
        const filtered = data.filter((e) => {
            if (e.hidden) {
                return false;
            }
            return true;
        });
        const output: IPostItem[] = [];
        filtered.forEach((e) => {
            const {
                uuid, name, email, website, avatar, parent, content, byAdmin, createdAt,
            } = e;
            const emailHashed: string | null = email ? SHA.md5(email) : null;
            const edited = (toTimeStamp(e.createdAt) < toTimeStamp(e.updatedAt));
            output.push({
                uuid,
                name,
                emailHashed,
                website,
                avatar,
                parent,
                content,
                byAdmin,
                createdAt,
                edited,
            });
        });
        return output;
    }

    public async getAllPosts(url: string) {
        const value = await fs.readJSON(this.getThreadPath(url), fsOpts);
        return value;
    }

    public async getPostsAmount(url: string) {
        const data: IPostQueryResults[] = await fs.readJSON(this.getThreadPath(url), fsOpts);
        const filtered = data.filter((e) => {
            if (e.hidden) {
                return false;
            }
            return true;
        });
        return filtered.length;
    }

    public async getPost(url: string, uuid: string) {
        const content: IPostQueryResults[] = await fs.readJSON(this.getThreadPath(url), fsOpts);
        while (content.length > 0) {
            const temp = content.pop();
            if (typeof temp !== 'undefined' && temp.uuid === uuid) {
                return temp;
            }
        }
        return null;
    }

    public async addPost(
        url: string,
        name: string | null,
        email: string,
        website: string | null,
        content: string,
        parent: string | null,
        receiveEmail: boolean,
        byAdmin: boolean,
        hidden = false,
        rating: number | null = null,
        {
            verifyLocked = false,
        } = {},
    ) {
        if (verifyLocked && this.getThreadLock(url)) {
            throw new Error('This thread is already locked and verifyLocked is enabled');
        }
        let list: IPostQueryResults[] = [];
        try {
            list = await fs.readJSON(this.getThreadPath(url), fsOpts);
        } catch (e) {
            if (e.code !== 'ENOENT') {
                throw e;
            }
        }
        const now = new Date().getTime();
        const threadUUID = this.indexMap.get(url)?.uuid;
        if (typeof threadUUID === 'undefined') {
            throw new Error('Unable to find target thread. It should be created first.');
        }
        const uuid = uuidv5(`pomment_${now}`, threadUUID);
        const postResults: IPostQueryResults = {
            uuid,
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
            editKey: crypto.randomBytes(8).toString('hex'),
            createdAt: now,
            updatedAt: now,
            origContent: content,
        };
        list.push(postResults);
        fs.writeJSONSync(this.getThreadPath(url), list, { ...fsOpts, spaces: 4 });
        return postResults;
    }

    public async editPost(url: string, uuid: string, {
        name,
        email,
        website,
        parent,
        content,
        hidden,
        byAdmin,
        receiveEmail,
        editKey,
        avatar,
        rating,
    // tslint:disable-next-line: align
    }: IPostEditArgs = {}, {
        verifyLocked = false,
        prevertUpdateTime = false,
    } = {}) {
        if (verifyLocked && this.getThreadLock(url)) {
            throw new Error('This thread is already locked and verifyLocked is enabled');
        }
        const list: IPostQueryResults[] = await fs.readJSON(this.getThreadPath(url), fsOpts);
        const toUpdate = {
            name,
            email,
            website,
            parent,
            content,
            hidden,
            byAdmin,
            receiveEmail,
            editKey,
            avatar,
            rating,
        };
        let targetID = 0;
        wipeInvalid(toUpdate);
        for (let i = 0; i < list.length; i++) {
            if (list[i].uuid === uuid) {
                targetID = i;
                break;
            }
            if (i >= list.length - 1) {
                throw new Error('The post user specified is not found');
            }
        }
        if (name !== undefined) {
            list[targetID].name = name;
        }
        if (email !== undefined) {
            list[targetID].email = email;
        }
        if (website !== undefined) {
            list[targetID].website = website;
        }
        if (parent !== undefined) {
            list[targetID].parent = parent;
        }
        if (content !== undefined) {
            list[targetID].content = content;
        }
        if (hidden !== undefined) {
            list[targetID].hidden = hidden;
        }
        if (byAdmin !== undefined) {
            list[targetID].byAdmin = byAdmin;
        }
        if (receiveEmail !== undefined) {
            list[targetID].receiveEmail = receiveEmail;
        }
        if (editKey !== undefined) {
            list[targetID].editKey = editKey;
        }
        if (avatar !== undefined) {
            list[targetID].avatar = avatar;
        }
        if (rating !== undefined) {
            list[targetID].rating = rating;
        }
        if (!prevertUpdateTime) {
            list[targetID].updatedAt = new Date().getTime();
        }
        await fs.writeJSONSync(this.getThreadPath(url), list, { ...fsOpts, spaces: 4 });
    }

    public async editPostUser(
        url: string, uuid: string, content: string, editKey: string, remove = false,
    ) {
        const wanted = await this.getPost(url, uuid);
        if (wanted === null) {
            throw new Error('Post not found');
        }
        if (!wanted.editKey) {
            throw new Error('Editing this post is not allowed');
        }
        if (wanted.editKey !== editKey) {
            throw new Error('Edit key is incorrect');
        }
        await this.editPost(url, uuid, {
            content: remove ? undefined : content,
            hidden: remove ? true : undefined,
        }, { verifyLocked: true });
    }

    public async editPostAdmin(url: string, uuid: string, content: string, remove = false) {
        await this.editPost(url, uuid, {
            content: remove ? undefined : content,
            hidden: remove ? true : undefined,
        });
    }

    public getThreadLock(url: string) {
        const lockPath = this.getThreadPath(url, undefined, 'lock');
        return fs.existsSync(lockPath);
    }

    public setThreadLock(url: string, locked: boolean) {
        const lockPath = this.getThreadPath(url, undefined, 'lock');
        if (fs.existsSync(lockPath)) {
            if (!locked) {
                fs.unlinkSync(lockPath);
            }
        } else if (locked) {
            fs.writeFileSync(lockPath, '');
        }
    }

    public trashThread(url: string) {
        this.indexMap.delete(url);
        this.saveThreadList();
        fs.mkdirpSync(path.join(this.workingDir, 'trashes'));
        if (fs.existsSync(this.getThreadPath(url))) {
            fs.moveSync(this.getThreadPath(url), this.getThreadPath(url, 'trashes'));
        }
        if (fs.existsSync(this.getThreadPath(url, undefined, 'lock'))) {
            fs.moveSync(this.getThreadPath(url, undefined, 'lock'), this.getThreadPath(url, 'trashes', 'lock'));
        }
    }

    private saveThreadList() {
        fs.writeJSONSync(path.join(this.workingDir, 'index.json'), [...this.indexMap], fsOpts);
    }
}

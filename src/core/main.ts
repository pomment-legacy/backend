import crypto from "crypto";
import fs from "fs-extra";
import path from "path";

import SHA from "../lib/sha";
import wipeInvalid from "../lib/wipe_invalid";

const fsOpts = { encoding: "utf8" };
const toTimeStamp = (e: number) => new Date(e).getTime();

export interface IThreadItem {
    title: string;
}

export interface IPostQueryResults {
    id: number;
    name: string | null;
    email: string;
    website: string | null;
    avatar: string | null;
    parent: number;
    content: string;
    hidden: boolean;
    rating: number | null;
    byAdmin: boolean;
    receiveEmail: boolean;
    editKey: string | null;
    updatedAt: number;
    createdAt: number;
    origContent: string;
}

export interface IPostEditArgs {
    id?: number;
    name?: string | null;
    email?: string;
    website?: string | null;
    avatar?: string | null;
    parent?: number;
    content?: string;
    hidden?: boolean;
    rating?: number | null;
    byAdmin?: boolean;
    receiveEmail?: boolean;
    editKey?: string | null;
    updatedAt?: number;
    createdAt?: number;
}

export interface IPostItem {
    id: number;
    name: string | null;
    emailHashed: string | null;
    website: string | null;
    avatar: string | null;
    parent: number;
    content: string;
    byAdmin: boolean;
    createdAt: number;
    edited: boolean;
}

export class PommentData {
    public static async init(workingDir: string) {
        fs.mkdirpSync(path.join(workingDir, "threads"));
        fs.writeFileSync(path.join(workingDir, "index.json"), "[]\n", fsOpts);
        return new PommentData(workingDir);
    }
    public workingDir: string;
    private indexMap: Map<string, IThreadItem>;

    constructor(workingDir: string) {
        this.workingDir = workingDir;
        this.indexMap = new Map<string, IThreadItem>(fs.readJSONSync(path.join(workingDir, "index.json"), fsOpts));
    }

    public getThreadPath(url: string, position = "threads", ext = "json") {
        const newURL = encodeURIComponent(url).replace(/\*/g, "%2A");
        let newName = `${newURL}.${ext}`;
        if (newName.length > 255) {
            newName = newName.slice(newName.length - 255);
        }
        return path.join(this.workingDir, position, newName);
    }

    public getThreadAttribute(url: string) {
        return this.indexMap.get(url);
    }

    public addThreadTitle(url: string, title: string, override = false) {
        if (!override && this.indexMap.has(url)) {
            return false;
        }
        this.indexMap.set(url, { title });
        this.saveThreadList();
        return true;
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
            const { id, name, email, website, avatar, parent, content, byAdmin, createdAt } = e;
            const emailHashed: string | null = email ? SHA.md5(email) : null;
            const edited = (toTimeStamp(e.createdAt) < toTimeStamp(e.updatedAt));
            output.push({
                id,
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
        return filtered;
    }

    public async getPost(url: string, id: number) {
        const content: IPostQueryResults[] = await fs.readJSON(this.getThreadPath(url), fsOpts);
        while (content.length > 0) {
            const temp = content.pop();
            if (typeof temp !== "undefined" && temp.id === id) {
                if (temp.hidden) {
                    return null;
                }
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
        parent = -1,
        receiveEmail: boolean,
        byAdmin: boolean,
        hidden = false,
        rating: number | null = null,
        {
            verifyLocked = false,
        } = {},
    ) {
        if (verifyLocked && this.getThreadLock(url)) {
            throw new Error("This thread is already locked and verifyLocked is enabled");
        }
        let list: IPostQueryResults[] = [];
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
        const postResults: IPostQueryResults = {
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
            origContent: content,
        };
        list.push(postResults);
        fs.writeJSONSync(this.getThreadPath(url), list, { ...fsOpts, spaces: 4 });
        return postResults;
    }

    public async editPost(url: string, id: number, {
        name, email, website, parent, content, hidden, byAdmin, receiveEmail, editKey, avatar, rating,
    // tslint:disable-next-line: align
    }: IPostEditArgs = {}, {
        verifyLocked = false,
        prevertUpdateTime = false,
    } = {}) {
        if (verifyLocked && this.getThreadLock(url)) {
            throw new Error("This thread is already locked and verifyLocked is enabled");
        }
        const list: IPostQueryResults[] = await fs.readJSON(this.getThreadPath(url), fsOpts);
        const toUpdate = {
            name, email, website, parent, content, hidden, byAdmin, receiveEmail, editKey, avatar, rating,
        };
        let targetID = 0;
        wipeInvalid(toUpdate);
        for (let i = 0; i < list.length; i++) {
            if (list[i].id === id) {
                targetID = i;
                break;
            }
            if (i >= list.length - 1) {
                throw new Error("The post user specified is not found");
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

    public async editPostUser(url: string, id: number, content: string, editKey: string, remove = false) {
        const wanted = await this.getPost(url, id);
        if (wanted === null) {
            throw new Error("Post not found");
        }
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

    public async editPostAdmin(url: string, id: number, content: string, remove = false) {
        await this.editPost(url, id, {
            content: remove ? undefined : content,
            hidden: remove ? true : undefined,
        });
    }

    public getThreadLock(url: string) {
        const lockPath = this.getThreadPath(url, undefined, "lock");
        return fs.existsSync(lockPath);
    }

    public setThreadLock(url: string, locked: boolean) {
        const lockPath = this.getThreadPath(url, undefined, "lock");
        if (fs.existsSync(lockPath)) {
            if (!locked) {
                fs.unlinkSync(lockPath);
            }
        } else if (locked) {
            fs.writeFileSync(lockPath, "");
        }
    }

    public trashThread(url: string) {
        this.indexMap.delete(url);
        this.saveThreadList();
        fs.mkdirpSync(path.join(this.workingDir, "trashes"));
        if (fs.existsSync(this.getThreadPath(url))) {
            fs.moveSync(this.getThreadPath(url), this.getThreadPath(url, "trashes"));
        }
        if (fs.existsSync(this.getThreadPath(url, undefined, "lock"))) {
            fs.moveSync(this.getThreadPath(url, undefined, "lock"), this.getThreadPath(url, "trashes", "lock"));
        }
    }

    private saveThreadList() {
        fs.writeJSONSync(path.join(this.workingDir, "index.json"), [...this.indexMap], fsOpts);
    }
}

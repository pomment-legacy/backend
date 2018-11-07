interface SiteAdmin {
    name: string;
    email: string;
    password: string;
}

interface ReCAPTCHA {
    enabled: boolean;
    siteKey: string;
    secretKey: string;
    minimumScore: number;
}

interface PostResults {
    id: number;
    name: string;
    email: string;
    website: string;
    parent: number;
    content: string;
    hidden: boolean;
    byAdmin: boolean;
    receiveEmail: boolean;
    editKey: string;
    updatedAt: Date;
    createdAt: Date;
};

interface PostItem {
    id: number;
    name: string;
    email: string;
    website: string;
    content: string;
    parent: number;
    hidden?: boolean;
    byAdmin: boolean;
    createdAt: Date;
};

interface ThreadAttribute {
    title: string;
};

interface ThreadItem {
    url: string;
    attributes: ThreadAttribute;
};

declare class PommentData {
    constructor(workingDir: string);
    static init(workingDir: string): void;
    getThreadPath(url: string): void;
    getThreads(): (ThreadItem)[];
    getThreadAttribute(): ThreadAttribute;
    addThreadTitle(url: string, title: string): void;
    getPosts(url: string, outputEmailHash: boolean, includeHidden: boolean): Promise<PostItem[]>;
    getPost(url: string, id: number, includeHidden: boolean): Promise<PostItem>;
    addPost(
        url: string,
        name: string,
        email: string,
        website: string,
        content: string,
        parent?: number,
        receiveEmail: boolean,
        byAdmin: boolean,
        hidden?: boolean): Promise<PostResults>;
    editPost(
        url: string,
        id: number,
        name: string,
        email: string,
        website: string,
        parent: number,
        content: string,
        hidden: boolean,
        byAdmin: boolean,
        receiveEmail: boolean,
        editKey: string): Promise<void>;
    editPostUser(url: any, id: any, content: any, remove?: any): Promise<void>;
    getThreadLock(url: string): boolean;
    setThreadLock(url: string, locked: boolean): void;
    trashThread(url: any): void;
}

declare namespace $POC {
    const apiHost: string;
    const apiPort: number;
    const siteName: string;
    const siteURL: string;
    const siteAdmin: SiteAdmin;
    const salt: string;
    const reCAPTCHA: ReCAPTCHA;
    const apiKey: string;
    const underProxy: boolean;
}

declare namespace $POM {
    const isDev: boolean;
    const logLevel: boolean;
}

declare const $POD: PommentData;

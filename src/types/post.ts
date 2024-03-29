export interface PommentThreadMetadata {
    uuid: string;
    title: string;
    url: string;
    firstPostAt: number;
    latestPostAt: number;
    amount: number;
    hiddenAmount: number;
}

export interface PommentPost {
    name: string
    email: string
    website: string
    parent: string
    content: string
    hidden: boolean
    byAdmin: boolean
    receiveEmail: boolean
    editKey: string
    createdAt: number
    updatedAt: number
    origContent: string
    avatar: string
    rating: number
    uuid: string
}

export type PommentSubmittedPost = Omit<PommentPost, 'uuid' | 'createdAt' | 'updatedAt' | 'origContent' | 'editKey'>

export type PommentSubmittedPostByGuest = Omit<PommentSubmittedPost, 'hidden' | 'byAdmin' | 'avatar' | 'rating'>

// 以下为旧的类型声明

export interface IPostQueryResults {
    id?: number;
    uuid: string;
    name: string | null;
    email: string;
    website: string | null;
    avatar: string | null;
    parent: string | null;
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

export interface IPostItem {
    uuid: string;
    name: string | null;
    emailHashed: string | null;
    website: string | null;
    avatar: string | null;
    parent: string | null;
    content: string;
    byAdmin: boolean;
    createdAt: number;
    edited: boolean;
}

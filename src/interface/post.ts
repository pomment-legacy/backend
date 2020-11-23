export interface IThreadItem {
    uuid: string;
    title: string;
    firstPostAt: number;
    latestPostAt: number;
    amount: number;
}

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

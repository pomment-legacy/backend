export interface IThreadItem {
    title: string;
    latestPostAt: number | null;
    amount: number;
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

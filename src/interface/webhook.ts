import { IPostQueryResults, IThreadItem } from './post';
import { IAuth } from '../lib/auth';

// eslint-disable-next-line no-shadow
export enum EventName {
    postAdded = 'post_added',
    postEdited = 'post_edited',
    postRemoved = 'post_removed',
}

export interface IWebhookRequest {
    event: EventName;
    auth: IAuth | null;
    url: string;
    thread: IThreadItem;
    post: IPostQueryResults;
    parent: IPostQueryResults | null;
}

import { IPostQueryResults, PommentThreadMetadata } from './post';
import { IAuth } from '../lib/auth';

// eslint-disable-next-line no-shadow
export enum EventName {
    postAdded = 'post_added',
}

export interface IWebhookRequest {
    event: EventName;
    auth: IAuth | null;
    url: string;
    thread: PommentThreadMetadata;
    post: IPostQueryResults;
    parent: IPostQueryResults | null;
}

import base64url from 'base64url';
import { ControllerConfig } from '@/types/server';
import { PommentComputedContext } from '@/server/main';
import { AjaxSuccess } from '@/server/utils/wrapper';

async function handler(ctx: PommentComputedContext) {
    const url = base64url.decode(ctx.params.urlEncoded);
    AjaxSuccess(ctx, {
        url,
        metadata: ctx.$pomment.getThreadMetadata(url),
        posts: await ctx.$pomment.getPosts(url),
    });
}

const thread: ControllerConfig = {
    method: 'get',
    path: '/admin/thread/:urlEncoded',
    handler,
};

export default thread;

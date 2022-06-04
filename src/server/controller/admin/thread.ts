import base64url from 'base64url';
import { ControllerConfig } from '@/types/server';
import { PommentComputedContext } from '@/server/main';
import { AjaxSuccess } from '@/server/utils/wrapper';
import { paging } from '@/server/utils/dataHandler';

async function handler(ctx: PommentComputedContext) {
    const url = base64url.decode(ctx.params.urlEncoded);
    const pageSize = Number(ctx.query.pageSize);
    const pageNum = Number(ctx.query.pageNum);
    const showAll = ctx.query.showAll === 'true';
    AjaxSuccess(ctx, {
        url,
        metadata: ctx.$pomment.getThreadMetadata(url),
        posts: paging(await ctx.$pomment.getPosts(url, {
            reverse: true,
            showAll,
        }), pageSize, pageNum),
    });
}

const thread: ControllerConfig = {
    method: 'get',
    path: '/admin/thread/:urlEncoded',
    handler,
};

export default thread;

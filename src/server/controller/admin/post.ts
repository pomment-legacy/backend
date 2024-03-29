import base64url from 'base64url';
import { ControllerConfig } from '@/types/server';
import { PommentComputedContext } from '@/server/main';
import { AjaxSuccess } from '@/server/utils/wrapper';

async function handler(ctx: PommentComputedContext) {
    const url = base64url.decode(ctx.params.urlEncoded);
    const uuid = ctx.params.uuid;
    AjaxSuccess(ctx, {
        url,
        metadata: ctx.$pomment.getThreadMetadata(url),
        post: await ctx.$pomment.getPost(url, uuid),
    });
}

const post: ControllerConfig = {
    method: 'get',
    path: '/admin/post/:urlEncoded/:uuid',
    handler,
};

export default post;

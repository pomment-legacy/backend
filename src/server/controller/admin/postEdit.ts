import base64url from 'base64url';
import { ControllerConfig } from '@/types/server';
import { PommentComputedContext } from '@/server/main';
import { AjaxSuccess } from '@/server/utils/wrapper';
import { PommentPost } from '@/types/post';

async function handler(ctx: PommentComputedContext) {
    const url = base64url.decode(ctx.params.urlEncoded);
    const uuid = ctx.params.uuid;
    const data = ctx.request.body as PommentPost;
    await ctx.$pomment.setPost(url, uuid, data);
    AjaxSuccess(ctx, {
        url,
        metadata: ctx.$pomment.getThreadMetadata(url),
        post: await ctx.$pomment.getPost(url, uuid),
    });
}

const post: ControllerConfig = {
    method: 'put',
    path: '/admin/post/:urlEncoded/:uuid',
    handler,
};

export default post;

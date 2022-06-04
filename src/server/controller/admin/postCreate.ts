import base64url from 'base64url';
import { ControllerConfig } from '@/types/server';
import { PommentComputedContext } from '@/server/main';
import { AjaxSuccess } from '@/server/utils/wrapper';
import { PommentSubmittedPost } from '@/types/post';

async function handler(ctx: PommentComputedContext) {
    const url = base64url.decode(ctx.params.urlEncoded);
    const data = ctx.request.body as PommentSubmittedPost;
    const result = await ctx.$pomment.createPost(url, data);
    AjaxSuccess(ctx, {
        url,
        metadata: ctx.$pomment.getThreadMetadata(url),
        post: await ctx.$pomment.getPost(url, result.uuid),
    });
}

const post: ControllerConfig = {
    method: 'post',
    path: '/admin/post/:urlEncoded',
    handler,
};

export default post;

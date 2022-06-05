import base64url from 'base64url';
import { ControllerConfig } from '@/types/server';
import { PommentComputedContext } from '@/server/main';
import { AjaxError, AjaxSuccess } from '@/server/utils/wrapper';
import validateUserPost from '@/server/model/validator/userPost';
import { PommentSubmittedPost, PommentSubmittedPostByGuest } from '@/types/post';

async function handler(ctx: PommentComputedContext) {
    const url = base64url.decode(ctx.params.urlEncoded);
    const title: string = ctx.request.body.title;
    const response: string = ctx.request.body.response;
    const post: PommentSubmittedPostByGuest = ctx.request.body.post;

    // 表单校验
    const result = await validateUserPost(post);
    if (!result) {
        AjaxError(ctx, 400);
        return;
    }

    // 构建待提交评论
    const constructedPost: PommentSubmittedPost = {
        ...post,
        hidden: ctx.$config.reCAPTCHA.enabled,
        byAdmin: false,
        avatar: '',
        rating: 0,
    };

    // 保存评论
    const savedPost = await ctx.$pomment.createPost(url, constructedPost, {
        title,
    });

    AjaxSuccess(ctx, { ...constructedPost, hidden: false });

    // 异步进行 reCAPTCHA 处理
    if (ctx.$config.reCAPTCHA.enabled) {
        ctx.$pomment.verifyPost(url, savedPost.uuid, {
            secret: ctx.$config.reCAPTCHA.secretKey,
            response,
            minimumScore: ctx.$config.reCAPTCHA.minimumScore,
        }).then(() => {}).catch((e) => {
            console.log(e);
        });
    }
}

const thread: ControllerConfig = {
    method: 'post',
    path: '/post/:urlEncoded',
    handler,
};

export default thread;

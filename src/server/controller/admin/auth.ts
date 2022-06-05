import { ControllerConfig } from '@/types/server';
import { PommentComputedContext } from '@/server/main';
import { sign } from '@/server/permission';
import { AjaxError, AjaxSuccess } from '@/server/utils/wrapper';
import crypto from 'crypto';

function handler(ctx: PommentComputedContext) {
    const { password } = ctx.request.body;
    const computedPassword = crypto.createHash('sha512').update(password ?? '').digest('hex');
    if (computedPassword !== ctx.$config.siteAdmin.password) {
        AjaxError(ctx, 400);
        return;
    }
    const expiresIn = 60 * 60 * 12;
    const token = sign(ctx.$config.siteAdmin.name, ctx.$config.siteAdmin.secret, expiresIn);
    AjaxSuccess(ctx, { token, expiresIn });
}

const auth: ControllerConfig = {
    method: 'post',
    path: '/admin/auth',
    handler,
};

export default auth;

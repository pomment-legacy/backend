import { ControllerConfig } from '@/types/server';
import { PommentComputedContext } from '@/server/main';
import { sign } from '@/server/permission';
import { AjaxSuccess } from '@/server/utils/wrapper';

function handler(ctx: PommentComputedContext) {
    const expiresIn = 720;
    const token = sign(ctx.$config.siteAdmin.name, ctx.$config.siteAdmin.secret, expiresIn);
    AjaxSuccess(ctx, { token, expiresIn });
}

const auth: ControllerConfig = {
    method: 'get',
    path: '/admin/auth',
    handler,
};

export default auth;

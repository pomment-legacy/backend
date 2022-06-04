import { ControllerConfig } from '@/types/server';
import { PommentComputedContext } from '@/server/main';
import { sign } from '@/server/permission';

function handler(ctx: PommentComputedContext) {
    const token = sign(ctx.$config.siteAdmin.name, ctx.$config.siteAdmin.secret, '12h');
    ctx.body = { token };
}

const auth: ControllerConfig = {
    method: 'get',
    path: '/admin/auth',
    handler,
};

export default auth;

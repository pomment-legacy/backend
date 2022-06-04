import { ControllerConfig } from '@/types/server';
import { PommentComputedContext } from '@/server/main';

function handler(ctx: PommentComputedContext) {
    ctx.body = { success: 'true' };
}

const userInfo: ControllerConfig = {
    method: 'get',
    path: '/admin/userInfo',
    handler,
};

export default userInfo;

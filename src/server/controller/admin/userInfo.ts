import { ControllerConfig } from '@/types/server';
import { PommentComputedContext } from '@/server/main';
import { AjaxSuccess } from '@/server/utils/wrapper';

function handler(ctx: PommentComputedContext) {
    AjaxSuccess(ctx);
}

const userInfo: ControllerConfig = {
    method: 'get',
    path: '/admin/userInfo',
    handler,
};

export default userInfo;

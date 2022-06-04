import { ControllerConfig } from '@/types/server';

const auth: ControllerConfig = {
    method: 'get',
    path: '/admin/test',
    handler(ctx: any) {
        ctx.response.body = {
            code: 0,
        };
    },
};

export default auth;

import { ControllerConfig } from '@/types/server';

function handler() {}

const auth: ControllerConfig = {
    method: 'get',
    path: '/admin/test',
    handler,
};

export default auth;

import { ControllerConfig } from '@/types/server';
import { PommentComputedContext } from '@/server/main';
import { AjaxSuccess } from '@/server/utils/wrapper';
import { paging } from '@/server/utils/dataHandler';

async function handler(ctx: PommentComputedContext) {
    const pageSize = Number(ctx.query.pageSize);
    const pageNum = Number(ctx.query.pageNum);
    AjaxSuccess(ctx, paging(ctx.$pomment.getThreadList(), pageSize, pageNum));
}

const threads: ControllerConfig = {
    method: 'get',
    path: '/admin/threads',
    handler,
};

export default threads;

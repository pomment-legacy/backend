import base64url from 'base64url';
import { ControllerConfig } from '@/types/server';
import { PommentComputedContext } from '@/server/main';
import { AjaxSuccess } from '@/server/utils/wrapper';
import { filterKey, paging } from '@/server/utils/dataHandler';
import crypto from 'crypto';

async function handler(ctx: PommentComputedContext) {
    const url = base64url.decode(ctx.params.urlEncoded);
    const pageSize = Number(ctx.query.pageSize);
    const pageNum = Number(ctx.query.pageNum);
    const rowsOriginal = await ctx.$pomment.getPosts(url, {
        reverse: true,
        safe: true,
    });
    const rows = rowsOriginal.map((e) => {
        const out = filterKey(e, ['email', 'hidden', 'receiveEmail', 'rating', 'editKey', 'origContent']);
        out.emailHashed = crypto.createHash('md5').update(e.email).digest('hex');
        return out;
    });
    AjaxSuccess(ctx, {
        url,
        posts: paging(rows, pageSize, pageNum),
    });
}

const thread: ControllerConfig = {
    method: 'get',
    path: '/thread/:urlEncoded',
    handler,
};

export default thread;

import base64url from 'base64url';
import { ControllerConfig } from '@/types/server';
import { PommentComputedContext } from '@/server/main';
import { AjaxSuccess } from '@/server/utils/wrapper';

async function handler(ctx: PommentComputedContext) {
    const url = base64url.decode(ctx.params.urlEncoded);
    const data = ctx.request.body as any;
    const result = await ctx.$pomment.updateThreadMetadata(url, data);
    AjaxSuccess(ctx, result);
}

const metaEdit: ControllerConfig = {
    method: 'put',
    path: '/admin/meta/:urlEncoded',
    handler,
};

export default metaEdit;

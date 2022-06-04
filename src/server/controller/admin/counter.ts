import { ControllerConfig } from '@/types/server';
import { PommentComputedContext } from '@/server/main';
import { AjaxSuccess } from '@/server/utils/wrapper';

async function handler(ctx: PommentComputedContext) {
    const items = [...ctx.$pomment.indexMap];
    for (let i = 0; i < items.length; i++) {
        // console.log(items[i][0]);
        // eslint-disable-next-line no-await-in-loop
        await ctx.$pomment.updateCounter(items[i][0]);
    }
    AjaxSuccess(ctx);
}

const metaEdit: ControllerConfig = {
    method: 'post',
    path: '/admin/counter/flush',
    handler,
};

export default metaEdit;

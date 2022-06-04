import { PommentComputedContext } from '@/server/main';
import messages, { PommentErrorCode } from '@/server/utils/messages';

export function AjaxSuccess(ctx: PommentComputedContext, data?: any) {
    ctx.body = {
        data,
        code: 200,
        message: '成功',
    };
}

export function AjaxError(ctx: PommentComputedContext, code: PommentErrorCode) {
    ctx.body = {
        data: null,
        code,
        message: messages[code],
    };
}

import log4js from 'log4js';
import { IAuth } from '../../lib/auth';
import { PommentComputedContext } from '../main';

export interface IManageThreadsBody {
    auth: IAuth;
}

const routeManageThreads = async (ctx: PommentComputedContext) => {
    const logger = log4js.getLogger('Server: /v3/manage/threads');
    logger.level = ctx.logLevel;
    const body: IManageThreadsBody = ctx.request.body;
    const { pomment, userAuth } = ctx;
    if (!userAuth.auth(body.auth.time, body.auth.token)) {
        ctx.status = 403;
        return;
    }
    ctx.response.body = pomment.getThreadList();
};

export default routeManageThreads;

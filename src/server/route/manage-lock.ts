import log4js from 'log4js';
import { IAuth } from 'pomment-common/dist/auth';
import { IContext } from '../main';

export interface IManageLockBody {
    auth: IAuth;
    url: string;
    locked: boolean;
}

const routeManageLock = async (ctx: IContext) => {
    const logger = log4js.getLogger('Server: /v3/manage/lock');
    logger.level = ctx.logLevel;
    const body: IManageLockBody = ctx.request.body;
    const { pomment, userAuth } = ctx;
    if (!userAuth.auth(body.auth.time, body.auth.token)) {
        ctx.status = 403;
        return;
    }
    pomment.setThreadLock(body.url, body.locked);
    ctx.response.body = '';
};

export default routeManageLock;

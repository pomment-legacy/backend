import log4js from 'log4js';
import { IContext } from './main';

export interface IAuthTestBody {
    time: number;
    token: string;
}

/**
 * 认证测试（在未来会被删除）
 */
const routeList = async (ctx: IContext) => {
    const logger = log4js.getLogger('Server: /auth-test');
    logger.level = ctx.logLevel;
    const { body } = ctx.request;
    const { pomment, userAuth } = ctx;
    ctx.response.body = {
        success: userAuth.auth(body.time, body.token),
    };
};

export default routeList;

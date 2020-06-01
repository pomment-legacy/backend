import log4js from 'log4js';
import { IAuth } from 'pomment-common/dist/auth';
import { IContext } from '../main';

export interface IManageListBody {
    auth: IAuth;
    url: string;
}

const routeManageList = async (ctx: IContext) => {
    const logger = log4js.getLogger('Server: /v2/manage/list');
    logger.level = ctx.logLevel;
    const body: IManageListBody = ctx.request.body;
    const { pomment, userAuth } = ctx;
    if (!userAuth.auth(body.auth.time, body.auth.token)) {
        ctx.status = 403;
        return;
    }
    ctx.response.body = pomment.getAllPosts(body.url);
};

export default routeManageList;

import log4js from 'log4js';
import { IAuth } from '../../lib/auth';
import { IContext } from '../main';

export interface IManageEditTitleBody {
    auth: IAuth;
    url: string;
    title: string;
}

const routeManageEditTitle = async (ctx: IContext) => {
    const logger = log4js.getLogger('Server: /v3/manage/edit-title');
    logger.level = ctx.logLevel;
    const body: IManageEditTitleBody = ctx.request.body;
    const { pomment, userAuth } = ctx;
    if (!userAuth.auth(body.auth.time, body.auth.token)) {
        ctx.status = 403;
        return;
    }
    await pomment.updateThreadInfo(body.url, body.title, true);
    ctx.response.body = '';
};

export default routeManageEditTitle;

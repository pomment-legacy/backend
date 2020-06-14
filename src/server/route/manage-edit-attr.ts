import log4js from 'log4js';
import { IAuth } from 'pomment-common/dist/auth';
import { IContext } from '../main';

export interface IManageEditAttrBody {
    auth: IAuth;
    url: string;
    id: number;
    name: string;
    email: string;
    website: string;
    avatar: string;
    hidden: boolean;
}

const routeManageEditAttr = async (ctx: IContext) => {
    const logger = log4js.getLogger('Server: /v3/manage/edit-attr');
    logger.level = ctx.logLevel;
    const body: IManageEditAttrBody = ctx.request.body;
    const { pomment, userAuth } = ctx;
    if (!userAuth.auth(body.auth.time, body.auth.token)) {
        ctx.status = 403;
        return;
    }
    pomment.editPost(body.url, body.id, {
        name: body.name,
        email: body.email,
        website: body.website,
        avatar: body.avatar,
        hidden: body.hidden,
    });
    ctx.response.body = '';
};

export default routeManageEditAttr;

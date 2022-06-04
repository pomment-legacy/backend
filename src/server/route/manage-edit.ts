import log4js from 'log4js';
import { IAuth } from '../../lib/auth';
import { PommentComputedContext } from '../main';

export interface IManageEditAttrBody {
    auth: IAuth;
    url: string;
    uuid: string;
    name: string;
    email: string;
    website: string;
    avatar: string;
    content: string;
    hidden: boolean;
}

const routeManageEdit = async (ctx: PommentComputedContext) => {
    const logger = log4js.getLogger('Server: /v3/manage/edit');
    logger.level = ctx.logLevel;
    const body: IManageEditAttrBody = ctx.request.body;
    const { pomment, userAuth } = ctx;
    if (!userAuth.auth(body.auth.time, body.auth.token)) {
        ctx.status = 403;
        return;
    }
    pomment.editPost(body.url, body.uuid, {
        name: body.name,
        email: body.email,
        website: body.website,
        avatar: body.avatar,
        content: body.content,
        hidden: body.hidden,
    });

    logger.info('Updating thread counter');
    ctx.pomment.updateCounter(body.url);

    ctx.response.body = '';
};

export default routeManageEdit;

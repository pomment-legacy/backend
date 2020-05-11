import log4js from 'log4js';
import { IPostQueryResults } from 'pomment-common/src/interface/post';
import { IAuth } from '../../lib/auth';
import { IContext } from '../main';

export interface IManageSubmitBody {
    auth: IAuth;
    parent: number;
    content: string;
    title: string;
    url: string;
}

const routeManageSubmit = async (ctx: IContext) => {
    const logger = log4js.getLogger('Server: /v2/manage/submit');
    logger.level = ctx.logLevel;
    const body: IManageSubmitBody = ctx.request.body;
    let query: IPostQueryResults;

    const { userAuth } = ctx;
    if (!userAuth.auth(body.auth.time, body.auth.token)) {
        ctx.status = 403;
        return;
    }

    try {
        query = await ctx.pomment.addPost(
            body.url,
            ctx.userConfig.siteAdmin.name,
            ctx.userConfig.siteAdmin.email,
            null,
            body.content.trim(),
            body.parent,
            false,
            true,
            false,
            null,
            { verifyLocked: true },
        );
        const {
            id, name, email, website, parent, content, editKey, createdAt, updatedAt,
        } = query;
        const userResult = {
            id, name, email, website, parent, content, editKey, createdAt, updatedAt,
        };
        ctx.response.body = userResult;
    } catch (e) {
        logger.error(e.toString());
        ctx.status = 500;
        return;
    }
    let reCAPTCHAScore: number | null = null;
    setTimeout(async () => {
        logger.info('Adding thread title');
        ctx.pomment.updateThreadInfo(body.url, body.title);
        logger.info('Handling webhooks');
        const thisParent = await ctx.pomment.getPost(body.url, body.parent);
        const attr = ctx.pomment.getThreadAttribute(body.url);
        if (typeof attr === 'undefined') {
            throw new Error('Thread item not found (possibly some failure happened during storage)');
        }
        const webhookResult = {
            event: 'new_comment',
            url: body.url,
            title: attr.title,
            content: { ...query, reCAPTCHAScore, parentContent: thisParent },
        };
        // TODO: 完成该部分
        // await executeWebhook(globalContext, webhookResult, logger);
        if (thisParent && thisParent.receiveEmail) {
            logger.info('Sending notify (if enabled)');
            // TODO: 完成该部分
            // await sendNotify(globalContext, logger, body.url, title, thisParent, query);
        }
        logger.info('Background task finished');
    }, 0);
};

export default routeManageSubmit;

import log4js from 'log4js';
import { sanitizeUrl } from '@braintree/sanitize-url';
import { IPostQueryResults } from '../../interface/post';
import { IWebhookRequest, EventName } from '../../interface/webhook';
import checkSubmit from '../../lib/check_submit';
import reCAPTCHA from '../../lib/recaptcha';
import { IContext } from '../main';
import executeWebhook from '../webhook/execute';
import sendNotify from '../notify/main';

export interface ISubmitBody {
    name: string | null;
    email: string;
    website: string | null;
    parent: string;
    content: string;
    receiveEmail: boolean;
    responseKey: string | null;
    title: string;
    url: string;
}

const routeSubmit = async (ctx: IContext) => {
    const logger = log4js.getLogger('Server: /v3/submit');
    logger.level = ctx.logLevel;
    const body: ISubmitBody = ctx.request.body;
    let query: IPostQueryResults;
    try {
        checkSubmit(body);
        logger.info('Adding thread title');
        ctx.pomment.updateThreadInfo(body.url, body.title);
        let finalName = body.name === null ? null : body.name.trim();
        let finalWebsite = body.website === null ? null : sanitizeUrl(body.website.trim());
        if (finalName === '') {
            finalName = null;
        }
        if (finalWebsite === '') {
            finalWebsite = null;
        }
        query = await ctx.pomment.addPost(
            body.url,
            finalName,
            body.email.trim(),
            finalWebsite,
            body.content.trim(),
            body.parent,
            body.receiveEmail,
            false,
            false,
            null,
            { verifyLocked: true },
        );
        const {
            uuid, name, email, website, parent, content, editKey, createdAt, updatedAt,
        } = query;
        const userResult = {
            uuid, name, email, website, parent, content, editKey, createdAt, updatedAt,
        };
        ctx.response.body = userResult;
    } catch (e) {
        logger.error((e as any).toString());
        ctx.status = 500;
        return;
    }
    let reCAPTCHAScore: number | null = null;
    setTimeout(async () => {
        if (ctx.userConfig.reCAPTCHA.enabled) {
            logger.info('Verifying user request (reCAPTCHA)');
            if (body.responseKey === null) {
                logger.info('Invaild responseKey!');
                await ctx.pomment.editPost(body.url, query.uuid, {
                    hidden: true,
                }, {
                    prevertUpdateTime: true,
                });
            } else {
                const result = await reCAPTCHA(
                    ctx.userConfig,
                    ctx.userConfig.reCAPTCHA.secretKey,
                    body.responseKey,
                    logger,
                );
                reCAPTCHAScore = result.score;
                await ctx.pomment.editPost(body.url, query.uuid, {
                    hidden: result.hidden,
                    rating: reCAPTCHAScore,
                }, {
                    prevertUpdateTime: true,
                });
            }
        }
        logger.info('Updating thread counter');
        ctx.pomment.updateCounter(body.url);

        logger.info('Handling webhooks');
        const thisParent = await ctx.pomment.getPost(body.url, body.parent);
        const attr = ctx.pomment.getThreadAttribute(body.url);
        if (typeof attr === 'undefined') {
            throw new Error('Thread item not found (possibly some failure happened during storage)');
        }
        const webhookResult: IWebhookRequest = {
            event: EventName.postAdded,
            auth: null,
            url: body.url,
            thread: attr,
            post: query,
            parent: thisParent,
        };
        executeWebhook(ctx.userConfig.webhook.targets, webhookResult, logger);
        if (thisParent && thisParent.receiveEmail) {
            logger.info('Sending notify (if enabled)');
            await sendNotify(ctx, body.url, attr.title, query, thisParent);
        }
        logger.info('Background task finished');
    }, 0);
};

export default routeSubmit;

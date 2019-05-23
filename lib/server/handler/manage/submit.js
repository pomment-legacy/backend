/* eslint-disable no-await-in-loop */

const log4js = require('log4js');
const executeWebhook = require('../../../webhook/execute');
const sendNotify = require('../../../notify/index');
const auth = require('./lib/auth');

const logger = log4js.getLogger('Server: /v2/manage/submit');

module.exports = async (ctx) => {
    logger.level = $POM.logLevel;
    const { body } = ctx.request;
    if (!auth(body.token, `submit ${body.url} -1`, body.time, $POC.siteAdmin.password)
        || $POC.apiKey === null
        || body.token !== $POC.apiKey) {
        logger.error('Failed to verify');
        ctx.status = 500;
        return false;
    }
    let query;
    try {
        if (body.parent >= 0) {
            await $POD.editPost(body.url, body.parent, {
                hidden: false,
            }, {
                prevertUpdateTime: true,
            });
        }
        query = await $POD.addPost(
            body.url,
            null,
            null,
            null,
            body.content.trim(),
            body.parent,
            body.receiveEmail,
            true,
            false,
        );
        const {
            id, parent, content, createdAt, updatedAt,
        } = query;
        const userResult = {
            id, parent, content, createdAt, updatedAt,
        };
        ctx.response.body = userResult;
    } catch (e) {
        logger.error(e.toString());
        ctx.status = 500;
        return false;
    }
    setTimeout(async () => {
        logger.info('Adding thread title');
        $POD.addThreadTitle(body.url, body.title);
        logger.info('Handling webhooks');
        const thisParent = await $POD.getPost(body.url, body.parent);
        const webhookResult = {
            event: 'new_comment',
            url: body.url,
            title: body.title,
            content: { ...query, reCAPTCHAScore: $POC.reCAPTCHA.enabled ? 1 : null, parentContent: thisParent },
        };
        await executeWebhook(webhookResult, logger);
        if (thisParent.receiveEmail) {
            logger.info('Sending notify (if enabled)');
            await sendNotify(logger, body.url, body.title, query, thisParent);
        }
        logger.info('Background task finished');
    }, 0);
    return true;
};

/* eslint-disable no-await-in-loop */

const log4js = require('log4js');
const executeWebhook = require('../../../webhook/execute');
const auth = require('./lib/auth');

const logger = log4js.getLogger('Server: /v2/submit');

module.exports = async (ctx) => {
    logger.level = $POM.logLevel;
    const { body } = ctx.request;
    if (!auth(body.token)) {
        logger.error('Failed to verify');
        ctx.status = 500;
        return false;
    }
    let query;
    try {
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
            title, url, parent, name, email, website, content, receiveEmail,
        } = query;
        const userResult = {
            title, url, parent, name, email, website, content, receiveEmail,
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
        const webhookResult = {
            event: 'new_comment',
            url: body.url,
            title: body.title,
            content: { ...query, reCAPTCHAScore: $POC.reCAPTCHA.enabled ? 1 : null },
        };
        await executeWebhook(webhookResult, logger);
        logger.info('Background task finished');
    }, 0);
    return true;
};

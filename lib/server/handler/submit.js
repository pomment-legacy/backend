/* eslint-disable no-await-in-loop */

const log4js = require('log4js');
const request = require('request');
const executeWebhook = require('../../webhook/execute');

const logger = log4js.getLogger('Server: /v2/submit');

module.exports = async (ctx) => {
    logger.level = $POM.logLevel;
    const { body } = ctx.request;
    let negative = 0;
    if (body.email.trim() === '') {
        logger.error('Email address is empty or only have whitespace characters');
        negative += 1;
    }
    if (!/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(body.email.trim())) {
        logger.error('Email address is illegal');
        negative += 1;
    }
    if (body.content.trim() === '') {
        logger.error('Content is empty or only have whitespace characters');
        negative += 1;
    }
    if (body.content.trim().replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '_').length > 1000) {
        logger.error('Content\'s length is more than 1000 characters');
        negative += 1;
    }
    if (typeof body.parent !== 'number') {
        logger.error('Parent value is not number');
        negative += 1;
    }
    if (typeof body.receiveEmail !== 'boolean') {
        logger.error('ReceiveEmail value is not boolean');
        negative += 1;
    }
    if (negative > 0) {
        ctx.status = 500;
        return false;
    }
    let query;
    try {
        const finalName = body.name.trim() || null;
        const finalWebsite = body.website.trim() || null;
        query = await $POD.addPost(
            body.url,
            finalName,
            body.email.trim(),
            finalWebsite,
            body.content.trim(),
            body.parent,
            body.receiveEmail,
            false,
            false,
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
        return false;
    }
    let reCAPTCHAScore = null;
    setTimeout(async () => {
        logger.info('Adding thread title');
        $POD.addThreadTitle(body.url, body.title);
        logger.info('Verifying user request');
        if ($POC.reCAPTCHA.enabled) {
            let shouldHidden = false;
            try {
                const result = await new Promise((resolve, reject) => {
                    request({
                        url: 'https://www.recaptcha.net/recaptcha/api/siteverify',
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'User-Agent': 'Pomment (reCAPTCHA Handler)',
                        },
                        body: `secret=${$POC.reCAPTCHA.secretKey}&response=${body.responseKey}`,
                    }, (e, response, content) => {
                        if (e) {
                            reject(e);
                        } else {
                            resolve(JSON.parse(content));
                        }
                    });
                });
                const respKeys = Object.keys(result);
                for (let i = 0; i < respKeys.length; i += 1) {
                    logger.info(`[reCAPTCHA] ${respKeys[i]}: ${result[respKeys[i]]}`);
                }
                reCAPTCHAScore = result.score;
                if (!result.success || result.score < $POC.reCAPTCHA.minimumScore || result.action !== 'submit_comment') {
                    shouldHidden = true;
                }
            } catch (e) {
                logger.error(e.toString());
                shouldHidden = true;
            }
            if (shouldHidden) {
                await $POD.editPost(body.url, query.id, {
                    hidden: true,
                }, {
                    prevertUpdateTime: true,
                });
            }
        }
        logger.info('Handling webhooks');
        const webhookResult = {
            event: 'new_comment',
            url: body.url,
            title: body.title,
            content: { ...query, reCAPTCHAScore, parentContent: (await $POD.getPost(body.url, body.parent)) },
        };
        await executeWebhook(webhookResult, logger);
        logger.info('Background task finished');
    }, 0);
    return true;
};

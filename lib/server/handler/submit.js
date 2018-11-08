/* eslint-disable no-await-in-loop */

const log4js = require('log4js');
const request = require('request');
const executeWebhook = require('../../webhook/execute');

const logger = log4js.getLogger('Server: /v2/submit');

module.exports = async (ctx) => {
    logger.level = $POM.logLevel;
    const { body } = ctx.request;
    let shouldHidden = false;
    let negative = 0;
    let reCAPTCHAScore = null;
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
    if ($POC.reCAPTCHA.enabled) {
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
        }).catch((e) => {
            logger.error(e.toString());
            shouldHidden = true;
        });
        const respKeys = Object.keys(body);
        for (let i = 0; i < respKeys.length; i += 1) {
            logger.info(`[reCAPTCHA] ${result[i]}: ${body[result[i]]}`);
        }
        reCAPTCHAScore = result.score;
        if (!result.success || result.score < $POC.reCAPTCHA.minimumScore || result.action !== 'submit_comment') {
            shouldHidden = true;
        }
    }
    let query;
    try {
        query = await $POD.addPost(
            body.url,
            body.name.trim(),
            body.email.trim(),
            body.website.trim(),
            body.content.trim(),
            body.parent,
            body.receiveEmail,
            false,
            shouldHidden,
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
            content: { ...query, reCAPTCHAScore },
        };
        await executeWebhook(webhookResult, logger);
        logger.info('Background task finished');
    }, 0);
    return true;
};

const log4js = require('log4js');
const request = require('request');
const executeWebhook = require('../../webhook/execute');

const logger = log4js.getLogger('Server: /v2/edit');

module.exports = async (ctx) => {
    logger.level = $POM.logLevel;
    const { body } = ctx.request;
    let reCAPTCHAScore = null;
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
        if (!shouldHidden) {
            await $POD.editPostUser(body.url, body.id, body.content, body.editKey);
        }
    }
    ctx.response.body = '';
    setTimeout(async () => {
        logger.info('Handling webhooks');
        const webhookResult = {
            event: 'edit_comment',
            url: body.url,
            title: body.title,
            content: { ...(await $POD.getPost(body.url, body.id)), reCAPTCHAScore },
        };
        await executeWebhook(webhookResult, logger);
        logger.info('Background task finished');
    }, 0);
    return true;
};

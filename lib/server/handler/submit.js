const log4js = require('log4js');
const request = require('request');

const logger = log4js.getLogger('Server: /v2/submit');

module.exports = async (ctx) => {
    logger.level = $POM.logLevel;
    const { body } = ctx.request;
    let shouldHidden = false;
    logger.info(body);
    if (body.email.trim() === ''
        || body.content.trim() === ''
        || typeof body.parent !== 'number'
        || typeof body.receiveEmail !== 'boolean') {
        ctx.response.body = { success: false };
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
        if (!result.success || result.score < $POC.reCAPTCHA.minimumScore || result.action !== 'submit_comment') {
            shouldHidden = true;
        }
    }
    try {
        const query = await $POD.addPost(
            body.url,
            body.name,
            body.email,
            body.website,
            body.content,
            body.parent,
            body.receiveEmail,
            false,
            shouldHidden,
        );
        delete query.hidden;
        delete query.byAdmin;
        delete query.receiveEmail;
        delete query.updatedAt;
        ctx.response.body = query;
    } catch (e) {
        logger.error(e.toString());
        ctx.status = 500;
        return false;
    }
    return true;
};

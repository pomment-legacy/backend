const log4js = require('log4js');
const request = require('superagent');

const logger = log4js.getLogger('Server: /v2/submit');

module.exports = async (ctx) => {
    logger.level = $POM.logLevel;
    const { body } = ctx.request;
    if (body.email.trim() === ''
        || body.content.trim() === ''
        || typeof body.parent !== 'number'
        || typeof body.receiveEmail !== 'boolean') {
        ctx.response.body = { success: false };
        return false;
    }
    if ($POC.reCAPTCHA.enabled) {
        const response = await request
            .post('https://www.recaptcha.net/recaptcha/api/siteverify')
            .type('form')
            .send({ secret: $POC.reCAPTCHA.secretKey })
            .send({ response: body.responseKey });
    }
    const result = await $POD.addPost(
        body.url,
        body.name,
        body.email,
        body.website,
        body.content,
        body.parent,
        body.receiveEmail,
        false,
        false,
    );
    return true;
};

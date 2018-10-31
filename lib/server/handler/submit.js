const log4js = require('log4js');
const request = require('request');

const logger = log4js.getLogger('Server: /v2/submit');

module.exports = async (ctx) => {
    logger.level = $POM.logLevel;
    const { body } = ctx.request;
    let shouldHidden = false;
    let nagivate = 0;
    if (body.email.trim() === '') {
        logger.error('Email address is empty or only have whitespace characters');
        nagivate += 1;
    }
    if (!/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(body.email.trim())) {
        logger.error('Email address is illegal');
        nagivate += 1;
    }
    if (body.content.trim() === '') {
        logger.error('Content is empty or only have whitespace characters');
        nagivate += 1;
    }
    if (typeof body.parent !== 'number') {
        logger.error('Parent value is not number');
        nagivate += 1;
    }
    if (typeof body.receiveEmail !== 'boolean') {
        logger.error('ReceiveEmail value is not boolean');
        nagivate += 1;
    }
    if (nagivate) {
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
        if (!result.success || result.score < $POC.reCAPTCHA.minimumScore || result.action !== 'submit_comment') {
            shouldHidden = true;
        }
    }
    try {
        const query = await $POD.addPost(
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
    (async () => {
        $POD.addThreadTitle(body.url, body.title);
    })();
    return true;
};

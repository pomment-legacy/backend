const request = require('request');

const reCAPTCHA = async (sec, res, logger) => {
    try {
        const result = await new Promise((resolve, reject) => {
            request({
                url: 'https://www.recaptcha.net/recaptcha/api/siteverify',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'Pomment (reCAPTCHA Handler)',
                },
                body: `secret=${sec}&response=${res}`,
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
        if (!result.success || result.score < $POC.reCAPTCHA.minimumScore || result.action !== 'submit_comment') {
            return {
                score: result.score,
                hidden: true,
            };
        }
        return {
            score: result.score,
            hidden: false,
        };
    } catch (e) {
        logger.error(e.toString());
        return {
            score: 0,
            hidden: true,
        };
    }
};

module.exports = reCAPTCHA;

const log4js = require('log4js');

const logger = log4js.getLogger('Server: /v2/list');

module.exports = async (ctx) => {
    logger.level = $POM.logLevel;
    const { body } = ctx.request;
    try {
        ctx.response.body = {
            success: true,
            url: body.url,
            locked: $POD.getThreadLock(body.url),
            content: await $POD.getPosts(body.url, true, false),
        };
    } catch (e) {
        logger.info(`Catched: ${e.toString()}`);
        ctx.response.body = {
            success: true,
            url: body.url,
            locked: false,
            content: [],
        };
    }
};

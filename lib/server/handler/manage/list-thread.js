const log4js = require('log4js');
const auth = require('./lib/auth');

const logger = log4js.getLogger('Server: /v2/manage/list-thread');

module.exports = async (ctx) => {
    logger.level = $POM.logLevel;
    const { body } = ctx.request;
    if (!auth(body.token, 'listThread', body.time, $POC.siteAdmin.password)
        || $POC.apiKey === null
        || body.token !== $POC.apiKey) {
        logger.error('Failed to verify');
        ctx.status = 500;
        return false;
    }
    const result = await $POD.getThreads();
    result.sort((a, b) => a.url.localeCompare(b.url));
    ctx.response.body = result;
    return true;
};

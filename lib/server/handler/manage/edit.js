const log4js = require('log4js');
const auth = require('./lib/auth');

const logger = log4js.getLogger('Server: /v2/manage/edit');

module.exports = async (ctx) => {
    logger.level = $POM.logLevel;
    const { body } = ctx.request;
    if (!auth(body.token, `edit ${body.url} ${body.id}`, body.time, $POC.siteAdmin.password)
        || $POC.apiKey === null
        || body.token !== $POC.apiKey) {
        logger.error('Failed to verify');
        ctx.status = 500;
        return false;
    }
    await $POD.editPostAdmin(body.url, body.id, body.content);
    ctx.response.body = '';
    return true;
};

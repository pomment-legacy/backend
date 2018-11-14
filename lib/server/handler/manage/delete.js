const log4js = require('log4js');
const auth = require('./lib/auth');

const logger = log4js.getLogger('Server: /v2/delete');

module.exports = async (ctx) => {
    logger.level = $POM.logLevel;
    const { body } = ctx.request;
    if (!auth(body.token)) {
        logger.error('Failed to verify');
        ctx.status = 500;
        return false;
    }
    await $POD.editPostAdmin(body.url, body.id, null, true);
    ctx.response.body = '';
    return false;
};

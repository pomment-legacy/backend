const log4js = require('log4js');

const logger = log4js.getLogger('Server: /v2/edit');

module.exports = async (ctx) => {
    logger.level = $POM.logLevel;
    const { body } = ctx.request;
    await $POD.editPostUser(body.url, body.id, body.content, body.editKey);
    ctx.response.body = '';
};

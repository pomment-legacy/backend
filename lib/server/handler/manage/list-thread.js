const log4js = require('log4js');

const logger = log4js.getLogger('Server: /v2/manage/list-thread');

module.exports = async (ctx) => {
    logger.level = $POM.logLevel;
    const result = await $POD.getThreads();
    result.sort((a, b) => a.url.localeCompare(b.url));
    ctx.response.body = result;
};

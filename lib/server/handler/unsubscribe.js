const log4js = require('log4js');
const base64url = require('base64url');

const logger = log4js.getLogger('Server: /unsubscribe');

module.exports = async (ctx) => {
    logger.level = $POM.logLevel;
    const { thread, id, editKey } = ctx.params;
    const url = base64url.decode(thread);
    try {
        const wanted = await $POD.getPost(url, Number(id), { includeHidden: false });
        if (!wanted.editKey) {
            throw new Error('Editing this post is not allowed');
        }
        if (wanted.editKey !== editKey) {
            throw new Error('Edit key is incorrect');
        }
        await $POD.editPost(url, Number(id), {
            receiveEmail: false,
        }, {
            verifyLocked: false,
            prevertUpdateTime: true,
        });
    } catch (e) {
        logger.error(e.toString());
        ctx.response.body = '<h1>Failed to unsubscribe.</h1>';
        return;
    }
    ctx.response.body = '<h1>Unsubscribed successfully.</h1>';
};

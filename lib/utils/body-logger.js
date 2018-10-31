const bodyLogger = (ctx, logger) => {
    logger.info(`[Request] IP: ${ctx.request.ip}`);
    if ($POM.isDev) {
        const headerKeys = Object.keys(ctx.header);
        for (let i = 0; i < headerKeys.length; i += 1) {
            logger.debug(`[Header] ${headerKeys[i]}: ${ctx.header[headerKeys[i]]}`);
        }
    } else {
        logger.info(`[Request] User Agent: ${ctx.header['user-agent']}`);
    }
    const { body } = ctx.request;
    const bodyKeys = Object.keys(body);
    for (let i = 0; i < bodyKeys.length; i += 1) {
        logger.info(`[Body] ${bodyKeys[i]}: ${body[bodyKeys[i]]}`);
    }
};

module.exports = bodyLogger;

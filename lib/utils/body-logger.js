const bodyLogger = (ctx, logger) => {
    logger.info(`[Request] IP: ${ctx.request.ip}`);
    logger.info(`[Request] User Agent: ${ctx.header['user-agent']}`);
    const { body } = ctx.request;
    const bodyKeys = Object.keys(body);
    for (let i = 0; i < bodyKeys.length; i += 1) {
        let temp = `[Body] ${bodyKeys[i]}`;
        if (!(bodyKeys[i] === 'editKey' || bodyKeys[i] === 'token' || bodyKeys[i] === 'password')) {
            temp += `: ${body[bodyKeys[i]]}`;
        }
        logger.info(temp);
    }
};

module.exports = bodyLogger;

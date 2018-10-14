module.exports = (ctx) => {
    ctx.status = 500;
    ctx.response.body = {
        success: false,
    };
};

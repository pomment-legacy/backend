/* eslint-disable global-require */

const fs = require('fs-extra');
const path = require('path');
const Koa = require('koa');
const koaBody = require('koa-body');
const koaJSON = require('koa-json');
const koaLogger = require('koa-logger');
const koaRouter = require('koa-router')();
const log4js = require('log4js');
const PommentData = require('pomment-core');
const bodyLogger = require('../utils/body-logger');

global.$POM = {};
$POM.isDev = process.env.NODE_ENV === 'development';
$POM.logLevel = $POM.isDev ? 'debug' : 'info';
$POM.path = null;

koaRouter.post('/v2/list', require('./handler/list'));
koaRouter.post('/v2/submit', require('./handler/submit'));
koaRouter.post('/v2/edit', require('./handler/edit'));
koaRouter.post('/v2/delete', require('./handler/delete'));
koaRouter.post('/v2/manage/submit', require('./handler/manage/submit'));
koaRouter.post('/v2/manage/edit', require('./handler/manage/edit'));
koaRouter.post('/v2/manage/delete', require('./handler/manage/delete'));
koaRouter.post('*', require('./handler/not_found'));
koaRouter.get('/', require('./handler/204'));
koaRouter.get('/unsubscribe/:thread/:id/:editKey', require('./handler/unsubscribe'));
koaRouter.get('*', require('./handler/404'));
koaRouter.options('*', require('./handler/204'));

const app = new Koa();
const logger = log4js.getLogger('Server');

app.use(koaBody());
app.use(koaJSON({ spaces: 4 }));
app.use(koaLogger((str) => {
    logger.info(str);
}));
app.use((ctx, next) => {
    if (process.env.NODE_ENV === 'development') {
        ctx.set('Access-Control-Request-Method', 'POST');
        ctx.set('Access-Control-Allow-Headers', 'Content-Type');
        ctx.set('Access-Control-Allow-Origin', '*');
    }
    bodyLogger(ctx, logger);
    return next();
});
app.use(koaRouter.routes());

module.exports = (userPath = process.cwd()) => {
    $POM.path = path.resolve(process.cwd(), userPath);
    global.$POC = fs.readJSONSync(path.join($POM.path, 'config.json'), { encoding: 'utf8' });
    global.$POD = new PommentData($POM.path);

    app.listen($POC.apiPort, $POC.apiHost);
    app.proxy = $POC.underProxy;

    logger.level = $POM.logLevel;
    logger.info(`The HTTP server is http://${$POC.apiHost}:${$POC.apiPort}`);
};

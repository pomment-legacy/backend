/* eslint-disable global-require */

const fs = require('fs-extra');
const path = require('path');
const Koa = require('koa');
const koaBody = require('koa-body');
const koaJSON = require('koa-json');
const koaLogger = require('koa-logger');
const koaRouter = require('koa-router')();
const log4js = require('log4js');

const PommentData = require('../core/data');

global.$POM = {};
$POM.isDev = process.env.NODE_ENV === 'development';
$POM.logLevel = $POM.isDev ? 'debug' : 'info';

koaRouter.post('/v2/list', require('./handler/list'));
koaRouter.post('*', require('./handler/not_found'));
koaRouter.get('/favicon.ico', require('./handler/404'));
koaRouter.get('/', require('./handler/204'));
koaRouter.get('*', require('./handler/not_found'));
koaRouter.options('*', require('./handler/204'));

const app = new Koa();
const logger = log4js.getLogger('Server');

app.use(koaBody());
app.use(koaJSON({ spaces: 4 }));
app.use(koaLogger((str) => {
    logger.info(str);
}));
app.use(koaRouter.routes());

module.exports = (userPath = process.cwd()) => {
    $POM.path = path.resolve(process.cwd(), userPath);
    global.$POC = fs.readJSONSync(path.join($POM.path, 'config.json'), { encoding: 'utf8' });
    global.$POD = new PommentData($POM.path);

    app.listen($POC.apiPort, $POC.apiHost);

    logger.level = $POM.logLevel;
    logger.info(`The HTTP server is http://${$POC.apiHost}:${$POC.apiPort}`);
};

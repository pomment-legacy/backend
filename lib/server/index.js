const fs = require('fs-extra');
const path = require('path');
const Koa = require('koa');
const koaBody = require('koa-body');
const koaJSON = require('koa-json');
const koaLogger = require('koa-logger');
const koaRouter = require('koa-router');
const log4js = require('log4js');

global.$POM = {};

const app = new Koa();
const logger = log4js.getLogger('Server');

app.use(koaBody());
app.use(koaJSON({ spaces: 4 }));
app.use(koaLogger((str) => {
    logger.info(str);
}));

module.exports = (userPath = process.cwd()) => {
    $POM.logLevel = process.env.NODE_ENV === 'development' ? 'debug' : 'info';
    $POM.path = path.resolve(process.cwd(), userPath);
    $POM.config = fs.readJSONSync(path.join($POM.path, 'config.json'), { encoding: 'utf8' });
    app.listen($POM.config.apiPort, $POM.config.apiHost);

    logger.level = $POM.logLevel;
    logger.info(`The HTTP server is http://${$POM.config.apiHost}:${$POM.config.apiPort}`);
};

const Koa = require('koa');
const koaBody = require('koa-body');
const koaJSON = require('koa-json');
const koaLogger = require('koa-logger');
const koaRouter = require('koa-router');

const app = new Koa();

app.use(koaBody());
app.use(koaJSON({ spaces: 4 }));
app.use(koaLogger());

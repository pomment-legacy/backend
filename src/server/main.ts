import fs from 'fs-extra';
import Koa from 'koa';
import body from 'koa-body';
import json from 'koa-json';
import kLogger from 'koa-logger';
import Router from 'koa-router';
import log4js from 'log4js';
import path from 'path';
import yaml from 'js-yaml';
import { Auth } from 'pomment-common/dist/auth';
import { PommentData } from '../core/main';
import { IConfig } from '../interface/config';
import { IPommentContext } from '../interface/context';
import routeDelete from './route/delete';
import routeEdit from './route/edit';
import routeList from './route/list';
import routeSubmit from './route/submit';
import routeManageSubmit from './route/manage-submit';
import routeManageList from './route/manage-list';
import routeManageThreads from './route/manage-threads';
import routeManageEdit from './route/manage-edit';
import routeManageLock from './route/manage-lock';
import routeManageEditTitle from './route/manage-edit-title';
import routeManagePost from './route/manage-post';

export type IContext =
    Koa.ParameterizedContext<{}, IPommentContext & Router.IRouterParamContext<{}, IPommentContext>>;

function bootServer(entry: string) {
    const logger = log4js.getLogger('Main');
    const logLevel = process.env.PMNT_LOG_LEVEL || 'info';
    const configPath = path.join(entry, 'config.yaml');

    const tryLoad: any = yaml.safeLoad(fs.readFileSync(configPath, { encoding: 'utf8' }));
    if (!tryLoad || typeof tryLoad !== 'object') {
        logger.fatal('Unable to parse config file');
        return;
    }

    const config: IConfig = tryLoad;
    const app = new Koa<{}, IPommentContext>();
    const router = new Router<{}, IPommentContext>();
    const pomment = new PommentData(entry);
    const auth = new Auth(config.siteAdmin.password);

    router.post('/v3/list', routeList);
    router.post('/v3/submit', routeSubmit);
    router.post('/v3/edit', routeEdit);
    router.post('/v3/delete', routeDelete);
    router.post('/v3/manage/submit', routeManageSubmit);
    router.post('/v3/manage/list', routeManageList);
    router.post('/v3/manage/threads', routeManageThreads);
    router.post('/v3/manage/edit', routeManageEdit);
    router.post('/v3/manage/lock', routeManageLock);
    router.post('/v3/manage/edit-title', routeManageEditTitle);
    router.post('/v3/manage/post', routeManagePost);
    // router.post('/auth-test', routeAuthTest);

    if (process.env.PMNT_LOG_LEVEL === 'debug') {
        router.options('*', (ctx) => {
            ctx.status = 200;
            return true;
        });
        app.use((ctx, next) => {
            ctx.set('Access-Control-Allow-Origin', '*');
            ctx.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
            ctx.set('Access-Control-Max-Age', '3600');
            ctx.set('Access-Control-Allow-Headers', 'x-requested-with, Authorization, Content-Type, Accept');
            ctx.set('Access-Control-Allow-Credentials', 'true');
            return next();
        });
    }

    app.use(kLogger());
    app.use((ctx, next) => {
        ctx.userConfig = config;
        ctx.pomment = pomment;
        ctx.logLevel = logLevel;
        ctx.userAuth = auth;
        ctx.userPath = entry;
        return next();
    });
    app.use(body());
    app.use(router.routes());
    app.use(json());
    app.listen(config.apiPort, config.apiHost);

    logger.level = logLevel;
    logger.info(`Server is listening at http://${config.apiHost}:${config.apiPort}`);
}

export default bootServer;

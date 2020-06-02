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
import routeManageEditAttr from './route/manage-edit-attr';

export type IContext =
    Koa.ParameterizedContext<{}, IPommentContext & Router.IRouterParamContext<{}, IPommentContext>>;

function bootServer(entry: string) {
    const logger = log4js.getLogger('Main');
    const logLevel = process.env.PMNT_LOG_LEVEL || 'info';
    const configPath = path.join(entry, 'config.yaml');
    const config: IConfig = yaml.safeLoad(fs.readFileSync(configPath, { encoding: 'utf8' }));
    const app = new Koa<{}, IPommentContext>();
    const router = new Router<{}, IPommentContext>();
    const pomment = new PommentData(entry);
    const auth = new Auth(config.siteAdmin.password);

    router.post('/v2/list', routeList);
    router.post('/v2/submit', routeSubmit);
    router.post('/v2/edit', routeEdit);
    router.post('/v2/delete', routeDelete);
    router.post('/v2/manage/submit', routeManageSubmit);
    router.post('/v2/manage/list', routeManageList);
    router.post('/v2/manage/threads', routeManageThreads);
    router.post('/v2/manage/edit-attr', routeManageEditAttr);
    // router.post('/auth-test', routeAuthTest);

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

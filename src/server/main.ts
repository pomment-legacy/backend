import fs from 'fs-extra';
import Koa from 'koa';
import body from 'koa-body';
import json from 'koa-json';
import kLogger from 'koa-logger';
import Router from 'koa-router';
import log4js from 'log4js';
import path from 'path';
import { PommentData } from '../core/main';
import { IConfig } from '../interface/config';
import { IPommentContext } from '../interface/context';
import routeDelete from './route/delete';
import routeEdit from './route/edit';
import routeList from './route/list';
import routeSubmit from './route/submit';

export type IContext = Koa.ParameterizedContext<{}, IPommentContext & Router.IRouterParamContext<{}, IPommentContext>>;

function bootServer(entry: string) {
    const logger = log4js.getLogger('Main');
    const logLevel = process.env.PMNT_LOG_LEVEL || 'info';
    const configPath = path.join(entry, 'config.json');
    const config: IConfig = fs.readJSONSync(configPath, { encoding: 'utf8' });
    const app = new Koa<{}, IPommentContext>();
    const router = new Router<{}, IPommentContext>();
    const pomment = new PommentData(entry);

    router.post('/v2/list', routeList);
    router.post('/v2/submit', routeSubmit);
    router.post('/v2/edit', routeEdit);
    router.post('/v2/delete', routeDelete);

    app.use(kLogger());
    app.use((ctx, next) => {
        ctx.userConfig = config;
        ctx.pomment = pomment;
        ctx.logLevel = logLevel;
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

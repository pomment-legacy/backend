import fs from 'fs-extra';
import Koa from 'koa';
import body from 'koa-body';
import json from 'koa-json';
import kLogger from 'koa-logger';
import Router from 'koa-router';
import log4js from 'log4js';
import path from 'path';
import yaml from 'js-yaml';
import { Auth } from '@/lib/auth';
import { PommentData } from '@/core/main';
import { PommentConfig } from '@/types/config';
import { PommentContext } from '@/types/context';
import { ControllerConfig } from '@/types/server';
import routeList from './route/list';
import routeSubmit from './route/submit';

export type PommentComputedContext =
    Koa.ParameterizedContext<{}, PommentContext & Router.IRouterParamContext<{}, PommentContext>>;

function bootServer(entry: string) {
    const logger = log4js.getLogger('Main');
    const logLevel = process.env.NODE_ENV === 'development' ? 'debug' : 'info';
    const configPath = path.join(entry, 'config.yaml');

    const tryLoad: any = yaml.load(fs.readFileSync(configPath, { encoding: 'utf8' }));
    if (!tryLoad || typeof tryLoad !== 'object') {
        logger.fatal('Unable to parse config file');
        return;
    }

    const config: PommentConfig = tryLoad;
    const app = new Koa<{}, PommentContext>();
    const router = new Router<{}, PommentContext>();
    const pomment = new PommentData(entry);
    const auth = new Auth(config.siteAdmin.password);

    // v3 routes
    router.post('/v3/list', routeList);
    router.post('/v3/submit', routeSubmit);

    // These v4 routes are injected automatically
    const req = require.context('./controller', true, /\.ts$/);
    req.keys().forEach((key: any) => {
        const data: ControllerConfig = req(key).default;
        router[data.method](`/v4${data.path}`, data.handler as any);
    });

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

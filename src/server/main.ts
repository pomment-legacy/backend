import fs from 'fs-extra';
import Koa from 'koa';
import body from 'koa-body';
import json from 'koa-json';
import kLogger from 'koa-logger';
import Router from 'koa-router';
import log4js from 'log4js';
import path from 'path';
import yaml from 'js-yaml';
import { PommentConfig } from '@/types/config';
import { PommentContext } from '@/types/context';
import { ControllerConfig } from '@/types/server';
import { checkPermission } from '@/server/permission';
import PommentDataContext from '@/server/model/pomment';
import { AjaxError } from '@/server/utils/wrapper';
import { PommentWebError } from '@/server/utils/error';

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
    const pomment = new PommentDataContext(entry);

    // These v4 routes are injected automatically
    const req = require.context('./controller', true, /\.ts$/);
    req.keys().forEach((key: any) => {
        const data: ControllerConfig = req(key).default;
        router[data.method](`/v4${data.path}`, data.handler as any);
    });

    app.use(kLogger());
    app.use(async (ctx, next) => {
        try {
            await next();
        } catch (err) {
            if (err instanceof PommentWebError) {
                AjaxError(ctx as any, err.code);
            } else {
                AjaxError(ctx as any, 500);
                ctx.app.emit('error', err, ctx);
            }
        }
    });
    app.use((ctx, next) => {
        ctx.$config = config;
        ctx.$pomment = pomment;
        return next();
    });
    app.use(body());
    app.use(checkPermission);
    app.use(router.routes());
    app.use(json());
    app.listen(config.apiPort, config.apiHost);

    logger.level = logLevel;
    logger.info(`Server is listening at http://${config.apiHost}:${config.apiPort}`);
}

export default bootServer;

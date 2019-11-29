import fs from "fs-extra";
import Koa from "koa";
import body from "koa-body";
import json from "koa-json";
import kLogger from "koa-logger";
import Router from "koa-router";
import log4js from "log4js";
import path from "path";
import { PommentData } from "../core/main";
import { IConfig } from "../interface/config";
import { IPommentContext } from "../interface/context";
import routeList from "./route/list";

export type IContext = Koa.ParameterizedContext<{}, IPommentContext & Router.IRouterParamContext<{}, IPommentContext>>;

function bootServer(entry: string) {
    const logger = log4js.getLogger("Main");
    const logLevel = process.env.PMNT_LOG_LEVEL || "info";
    const configPath = path.join(entry, "config.json");
    const config: IConfig = fs.readJSONSync(configPath, { encoding: "utf8" });
    const app = new Koa<{}, IPommentContext>();
    const router = new Router<{}, IPommentContext>();
    const pomment = new PommentData(entry);

    router.post("/v2/list", routeList);

    app.use((ctx, next) => {
        ctx.userConfig = config;
        ctx.pomment = pomment;
        ctx.logLevel = logLevel;
        return next();
    });
    app.use(body());
    app.use(router.routes());
    app.use(json());
    app.use(kLogger());
    app.listen(5000);

    logger.level = logLevel;
    logger.info("Server is listening at 5000");
}

export default bootServer;

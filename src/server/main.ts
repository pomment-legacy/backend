import fs from "fs-extra";
import Koa from "koa";
import json from "koa-json";
import Router from "koa-router";
import log4js from "log4js";
import path from "path";
import { IConfig } from "../interface/config";
import { IPommentContext } from "../interface/context";

function bootServer(entry: string) {
    const logger = log4js.getLogger("Main");
    const logLevel = process.env.PMNT_LOG_LEVEL || "info";
    const configPath = path.join(entry, "config.json");
    const config: IConfig = fs.readJSONSync(configPath, { encoding: "utf8" });
    const app = new Koa<{}, IPommentContext>();
    const router = new Router<{}, IPommentContext>();

    router.get("/", (ctx) => {
        ctx.body = ctx.userConfig;
    });
    app.use((ctx, next) => {
        ctx.userConfig = config;
        return next();
    });
    app.use(router.routes());
    app.use(json());
    app.listen(5000);

    logger.level = logLevel;
    logger.info("Server is listening at 5000");
}

export default bootServer;

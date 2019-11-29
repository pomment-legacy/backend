import fs from "fs-extra";
import Koa from "koa";
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
    const app = new Koa();
    const router = new Router();

    router.get("/", (ctx) => {
        console.log(ctx);
    });
    app.use((ctx, next) => {
        ctx.pmntConfig = config;
        return next();
    });
    app.use(router.routes());
    app.listen(5000);

    logger.level = logLevel;
    logger.info("Server is listening at 5000");
}

export default bootServer;

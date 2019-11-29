import * as Koa from "koa";
import * as Router from "koa-router";
import log4js from "log4js";

function bootServer(path: string) {
    const logger = log4js.getLogger("Main");
    const logLevel = process.env.PMNT_LOG_LEVEL || "info";
}

export default bootServer;

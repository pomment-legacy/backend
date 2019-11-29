import log4js from "log4js";
import { IContext } from "../main";

const routeList = async (ctx: IContext) => {
    const logger = log4js.getLogger("Server: /v2/list");
    logger.level = ctx.logLevel;
    const { body } = ctx.request;
    const { pomment } = ctx;
    try {
        ctx.response.body = {
            url: body.url,
            locked: pomment.getThreadLock(body.url),
            content: await pomment.getPosts(body.url),
        };
    } catch (e) {
        if (e.code === "ENOENT") {
            ctx.response.body = {
                url: body.url,
                locked: false,
                content: [],
            };
            return;
        }
        throw e;
    }
};

export default routeList;

import log4js from "log4js";
import reCAPTCHA from "../../lib/recaptcha";
import { IContext } from "../main";

export interface IDeleteBody {
    url: string;
    id: number;
    content: string;
    editKey: string;
    responseKey: string | null;
}

const routeDelete = async (ctx: IContext) => {
    const logger = log4js.getLogger("Server: /v2/delete");
    logger.level = ctx.logLevel;
    const body: IDeleteBody = ctx.request.body;
    await ctx.pomment.editPostUser(body.url, body.id, "", body.editKey, true);
    ctx.response.body = "";
};

export default routeDelete;

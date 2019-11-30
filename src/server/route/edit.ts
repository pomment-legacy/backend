import log4js from "log4js";
import reCAPTCHA from "../../lib/recaptcha";
import { IContext } from "../main";

export interface IEditBody {
    url: string;
    id: number;
    content: string;
    editKey: string;
    responseKey: string | null;
}

const routeEdit = async (ctx: IContext) => {
    const logger = log4js.getLogger("Server: /v2/edit");
    logger.level = ctx.logLevel;
    const body: IEditBody = ctx.request.body;
    let reCAPTCHAScore: number | null = null;
    ctx.response.body = "";
    if (ctx.userConfig.reCAPTCHA.enabled) {
        if (body.responseKey === null) {
            logger.info("Invaild responseKey!");
            ctx.status = 400;
            return false;
        } else {
            const result = await reCAPTCHA(
                ctx.userConfig,
                ctx.userConfig.reCAPTCHA.secretKey,
                body.responseKey,
                logger,
            );
            reCAPTCHAScore = result.score;
            if (!result.hidden) {
                await ctx.pomment.editPostUser(body.url, body.id, body.content, body.editKey);
            } else {
                return true;
            }
        }
    }
    await ctx.pomment.editPostUser(body.url, body.id, body.content, body.editKey);
    return true;
    // setTimeout(async () => {
    //     logger.info("Handling webhooks");
    //     const webhookResult = {
    //         event: "edit_comment",
    //         url: body.url,
    //         title: body.title,
    //         content: { ...(await $POD.getPost(body.url, body.id)), reCAPTCHAScore },
    //     };
    //     await executeWebhook(globalContext, webhookResult, logger);
    //     logger.info("Background task finished");
    // }, 0);
    return true;
};

export default routeEdit;

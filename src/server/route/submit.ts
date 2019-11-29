import log4js from "log4js";
import { IPostQueryResults } from "../../core/main";
import checkSubmit from "../../lib/check_submit";
import reCAPTCHA from "../../lib/recaptcha";
import { IContext } from "../main";

export interface ISubmitBody {
    name: string | null;
    email: string;
    website: string | null;
    parent: number;
    content: string;
    receiveEmail: boolean;
    responseKey: string | null;
    title: string;
    url: string;
}

const routeSubmit = async (ctx: IContext) => {
    const logger = log4js.getLogger("Server: /v2/submit");
    logger.level = ctx.logLevel;
    const body: ISubmitBody = ctx.request.body;
    checkSubmit(body);
    let query: IPostQueryResults;
    try {
        let finalName = body.name === null ? null : body.name.trim();
        let finalWebsite = body.website === null ? null : body.website.trim();
        if (finalName === "") {
            finalName = null;
        }
        if (finalWebsite === "") {
            finalWebsite = null;
        }
        query = await ctx.pomment.addPost(
            body.url,
            finalName,
            body.email.trim(),
            finalWebsite,
            body.content.trim(),
            body.parent,
            body.receiveEmail,
            false,
            false,
            null,
            { verifyLocked: true },
        );
        const {
            id, name, email, website, parent, content, editKey, createdAt, updatedAt,
        } = query;
        const userResult = {
            id, name, email, website, parent, content, editKey, createdAt, updatedAt,
        };
        ctx.response.body = userResult;
    } catch (e) {
        logger.error(e.toString());
        ctx.status = 500;
        return;
    }
    let reCAPTCHAScore: number | null = null;
    setTimeout(async () => {
        logger.info("Adding thread title");
        ctx.pomment.addThreadTitle(body.url, body.title);
        if (ctx.userConfig.reCAPTCHA.enabled) {
            logger.info("Verifying user request (reCAPTCHA)");
            if (body.responseKey === null) {
                logger.info("Invaild responseKey!");
                await ctx.pomment.editPost(body.url, query.id, {
                    hidden: true,
                }, {
                    prevertUpdateTime: true,
                });
            } else {
                const result = await reCAPTCHA(
                    ctx.userConfig,
                    ctx.userConfig.reCAPTCHA.secretKey,
                    body.responseKey,
                    logger,
                );
                reCAPTCHAScore = result.score;
                await ctx.pomment.editPost(body.url, query.id, {
                    hidden: result.hidden,
                    rating: reCAPTCHAScore,
                }, {
                    prevertUpdateTime: true,
                });
            }
        }
        logger.info("Handling webhooks");
        const thisParent = await ctx.pomment.getPost(body.url, body.parent);
        const attr = ctx.pomment.getThreadAttribute(body.url);
        if (typeof attr === "undefined") {
            throw new Error("Thread item not found (possibly some failure happened during storage)");
        }
        const webhookResult = {
            event: "new_comment",
            url: body.url,
            title: attr.title,
            content: { ...query, reCAPTCHAScore, parentContent: thisParent },
        };
        // TODO: 完成该部分
        // await executeWebhook(globalContext, webhookResult, logger);
        if (thisParent && thisParent.receiveEmail) {
            logger.info("Sending notify (if enabled)");
            // TODO: 完成该部分
            // await sendNotify(globalContext, logger, body.url, title, thisParent, query);
        }
        logger.info("Background task finished");
    }, 0);
};

export default routeSubmit;

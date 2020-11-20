import log4js from 'log4js';
import { IContext } from '../main';

export interface IListBody {
    url: string;
}

/**
 * 读取评论列表。
 *
 * * 路径：`/v2/list`
 * * 请求方式：POST
 * * 参数：
 *  * `url`: 评论串源地址
 * @param ctx 上下文
 */
const routeList = async (ctx: IContext) => {
    const logger = log4js.getLogger('Server: /v3/list');
    logger.level = ctx.logLevel;
    const body: IListBody = ctx.request.body;
    const { pomment } = ctx;
    try {
        ctx.response.body = {
            url: body.url,
            locked: pomment.getThreadLock(body.url),
            content: await pomment.getPosts(body.url),
        };
    } catch (e) {
        if (e.code === 'ENOENT') {
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

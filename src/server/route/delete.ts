import log4js from 'log4js';
import reCAPTCHA from '../../lib/recaptcha';
import { IContext } from '../main';

export interface IDeleteBody {
    url: string;
    uuid: string;
    editKey: string;
}

const routeDelete = async (ctx: IContext) => {
    const logger = log4js.getLogger('Server: /v3/delete');
    logger.level = ctx.logLevel;
    const body: IDeleteBody = ctx.request.body;
    await ctx.pomment.editPostUser(body.url, body.uuid, '', body.editKey, true);
    ctx.response.body = '';
};

export default routeDelete;

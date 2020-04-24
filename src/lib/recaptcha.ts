import { Logger } from 'log4js';
import request from 'request';
import { IConfig } from '../interface/config';

//  https://developers.google.com/recaptcha/docs/v3
interface IResult {
    success: boolean;
    score: number;
    action: string;
    // eslint-disable-next-line camelcase
    challenge_ts: string;
    hostname: string;
    'error-codes': any;
}

const reCAPTCHA = async (config: IConfig, sec: string, res: string, logger: Logger) => {
    try {
        const result: IResult = await new Promise((resolve, reject) => {
            request({
                url: 'https://www.recaptcha.net/recaptcha/api/siteverify',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'Pomment (reCAPTCHA Handler)',
                },
                body: `secret=${sec}&response=${res}`,
            }, (e, response, content) => {
                if (e) {
                    reject(e);
                } else {
                    resolve(JSON.parse(content));
                }
            });
        });
        const respKeys = Object.entries(result);
        respKeys.forEach((e) => {
            logger.info(`[reCAPTCHA] ${e[0]}: ${e[1]}`);
        });
        if (!result.success || result.score < config.reCAPTCHA.minimumScore || result.action !== 'submit_comment') {
            return {
                score: result.score,
                hidden: true,
            };
        }
        return {
            score: result.score,
            hidden: false,
        };
    } catch (e) {
        logger.error(e.toString());
        return {
            score: 0,
            hidden: true,
        };
    }
};

export default reCAPTCHA;

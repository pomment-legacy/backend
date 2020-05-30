import { Logger } from 'log4js';
import axios from 'axios';
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
        const params = new URLSearchParams();
        params.append('secret', sec);
        params.append('response', res);
        const request = await axios.post('https://www.recaptcha.net/recaptcha/api/siteverify', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Pomment (reCAPTCHA Handler)',
            },
        });
        const result: IResult = request.data;
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

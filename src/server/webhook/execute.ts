/* eslint-disable no-param-reassign */
/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */

import axios from 'axios';
import crypto from 'crypto';
import { Logger } from 'log4js';
import { IWebhookRequest } from 'pomment-common/dist/interface/webhook';
import { IAuth } from 'pomment-common/dist/auth';
import { IWebhookItem } from '../../interface/config';

const executeWebhook = async (list: IWebhookItem[], data: IWebhookRequest, logger: Logger) => {
    for (let i = 0; i < list.length; i++) {
        logger.info(`Performing webhook request (${i + 1} / ${list.length}): ${list[i].url}`);
        try {
            const iToken = list[i].token;
            if (iToken !== null) {
                const time = new Date().getTime();
                const token = crypto.createHmac('sha512', iToken).update(`${time}`).digest('hex');
                // eslint-disable-next-line no-param-reassign
                const auth: IAuth = { time, token };
                data.auth = auth;
            }
            const result = await axios.post(list[i].url, data, {
                headers: {
                    'User-Agent': 'Pomment (Webhook Handler)',
                },
            });
            logger.info(`Server returned ${result.status}`);
            if (result.status >= 400) {
                logger.info(`Response content: ${result.data}`);
            }
        } catch (e) {
            logger.error(e.toString());
            continue;
        }
    }
};

export default executeWebhook;

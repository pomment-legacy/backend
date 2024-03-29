/* eslint-disable no-param-reassign */
/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */

import axios from 'axios';
import crypto from 'crypto';
import { Logger } from 'log4js';
import { IWebhookRequest } from '../../types/webhook';
import { IAuth } from '../../lib/auth';
import { PommentWebhookItem } from '../../types/config';

const executeWebhook = async (list: PommentWebhookItem[], data: IWebhookRequest, logger: Logger) => {
    if (!list) {
        logger.debug('No webhooks!');
        return;
    }
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
            logger.error((e as any).toString());
            continue;
        }
    }
};

export default executeWebhook;

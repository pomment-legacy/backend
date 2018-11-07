/* eslint-disable no-await-in-loop */
/* eslint-disable no-loop-func */
const path = require('path');
const fs = require('fs-extra');
const request = require('request');

const executeWebhook = async (data, logger) => {
    const webhookList = fs.readFileSync(path.join($POM.path, 'webhooks.txt'), { encoding: 'utf8' })
        .trim()
        .split('\n');
    for (let i = 0; i < webhookList.length; i += 1) {
        logger.info(`Performing webhook request (${i + 1} / ${webhookList.length}): ${webhookList[i]}`);
        const result = await new Promise((resolve, reject) => {
            request({
                url: webhookList[i],
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Pomment (Webhook Handler)',
                },
                body: JSON.stringify(data),
            }, (e, response, content) => {
                if (e) {
                    reject(e);
                } else {
                    resolve({ response, content });
                }
            });
        }).catch((e) => {
            logger.error(e.toString());
        });
        logger.info(`Server returned ${result.response.statusCode}`);
        if (result.response.statusCode >= 400) {
            logger.info(`Response content: ${result.content}`);
        }
    }
};

module.exports = executeWebhook;

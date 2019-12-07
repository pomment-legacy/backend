import axios from "axios";
import { Logger } from "log4js";

const executeWebhook = async (list: string[], data: any, logger: Logger) => {
    for (let i = 0; i < list.length; i++) {
        logger.info(`Performing webhook request (${i + 1} / ${list.length}): ${list[i]}`);
        try {
            const result = await axios.post(list[i], {
                headers: {
                    "User-Agent": "Pomment (Webhook Handler)",
                },
                data,
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

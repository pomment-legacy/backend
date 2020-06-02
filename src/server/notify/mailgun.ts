import mailgun from 'mailgun-js';
import log4js from 'log4js';
import { IContext } from '../main';

const sendByMailgun = async (ctx: IContext, to: string, subject: string, content: string) => {
    const config = ctx.userConfig;
    const logger = log4js.getLogger('Mailgun');
    logger.level = ctx.logLevel;
    const mail = mailgun({
        apiKey: config.guestNotify.mailgunAPIKey,
        domain: config.guestNotify.mailgunDomain,
    });
    const result = await mail.messages().send({
        from: config.guestNotify.smtpSender, to, subject, html: content,
    });
    logger.info(`Message sent: ${result.id}`);
};

export default sendByMailgun;

import nodemailer from 'nodemailer';
import htmlToText from 'html-to-text';
import log4js from 'log4js';
import { IContext } from '../main';

const sendBySMTP = async (ctx: IContext, to: string, subject: string, content: string) => {
    const config = ctx.userConfig;
    const logger = log4js.getLogger('SMTP');
    logger.level = ctx.logLevel;
    const transporter = nodemailer.createTransport({
        host: config.guestNotify.smtpHost,
        port: config.guestNotify.smtpPort,
        secure: config.guestNotify.smtpSecure,
        auth: {
            user: config.guestNotify.smtpUsername,
            pass: config.guestNotify.smtpPassword,
        },
    });
    const result = await transporter.sendMail({
        from: config.guestNotify.smtpSender,
        to,
        subject,
        text: htmlToText.fromString(content),
        html: content,
    });
    logger.info(`Message sent: ${result.messageId}`);
};

export default sendBySMTP;

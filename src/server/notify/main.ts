import base64url from 'base64url';
import fs from 'fs';
import log4js from 'log4js';
import path from 'path';
import { IPostQueryResults } from '../../interface/post';
import escapeHTML from './espace';
import { IContext } from '../main';
import { NotifyType } from '../../interface/config';
import sendBySMTP from './smtp';
import sendByMailgun from './mailgun';

interface IReplacePlan {
    from: string;
    to: string;
    line: boolean;
}

const sendNotify = async (
    ctx: IContext,
    url: string,
    title: string,
    main: IPostQueryResults,
    parent: IPostQueryResults,
) => {
    const config = ctx.userConfig;
    const logger = log4js.getLogger('Notify');
    logger.level = ctx.logLevel;
    if (!config.guestNotify || config.guestNotify.mode === NotifyType.none) {
        logger.info('Notify mode not set!');
        return;
    }
    const template = fs.readFileSync(path.resolve(ctx.userPath, 'mail_template.html'), { encoding: 'utf8' });
    let mailData = template;
    let mailTitle = config.guestNotify.title;
    const unsubscriber = `${config.apiURL}/unsubscribe/${base64url.encode(url)}/${parent.uuid}/${parent.editKey}`;
    const replacePlan: IReplacePlan[] = [
        { from: '{{title}}', to: title, line: false },
        { from: '{{url}}', to: url, line: false },
        { from: '{{parent:name}}', to: String(parent.name), line: false },
        { from: '{{parent:content}}', to: parent.content, line: true },
        { from: '{{name}}', to: String(main.name), line: false },
        { from: '{{content}}', to: main.content, line: true },
        { from: '{{unsubscriber}}', to: unsubscriber, line: false },
    ];
    replacePlan.forEach((e) => {
        mailData = mailData.replace(new RegExp(e.from, 'g'), escapeHTML(e.to, e.line));
        mailTitle = mailTitle.replace(new RegExp(e.from, 'g'), e.to);
    });
    try {
        switch (config.guestNotify.mode) {
        case NotifyType.smtp: {
            // smtp
            logger.info('Sending through SMTP ...');
            await sendBySMTP(ctx, parent.email, mailTitle, mailData);
            break;
        }
        case NotifyType.mailgun: {
            // mailgun
            logger.info('Sending through Mailgun ...');
            await sendByMailgun(ctx, parent.email, mailTitle, mailData);
            break;
        }
        default: {
            logger.info('No vaild send mode set!');
            break;
        }
        }
    } catch (e) {
        logger.error(`Unable to send notify: ${e}`);
    }
};

export default sendNotify;

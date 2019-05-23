const nodemailer = require('nodemailer');
const fs = require('fs-extra');
const path = require('path');
const htmlToText = require('html-to-text');
const escapeHTML = require('./escape');

const template = fs.readFileSync(path.resolve($POM.path, 'mail_notify.html'), { encoding: 'utf8' });

const sendNotify = async (logger, url, title, parent, main) => {
    // 没有启用任何访客提醒模式
    if ($POC.guestNotify.mode <= 0) {
        logger.debug('Guest notify is disabled!');
        return;
    }
    switch ($POC.guestNotify.mode) {
        // Option 1: Send email
        case 1: {
            const transporter = nodemailer.createTransport({
                host: $POC.guestNotify.smtpHost,
                port: $POC.guestNotify.smtpPort,
                secure: $POC.guestNotify.smtpSecure,
                auth: {
                    user: $POC.guestNotify.smtpUsername,
                    pass: $POC.guestNotify.smtpPassword,
                },
            });
            let mailData = template;
            let mailTitle = $POC.guestNotify.title;
            const replacePlan = [
                { from: '{{title}}', to: title, line: false },
                { from: '{{url}}', to: url, line: false },
                { from: '{{parent:name}}', to: parent.name, line: false },
                { from: '{{parent:website}}', to: parent.website, line: false },
                { from: '{{parent:content}}', to: parent.content, line: true },
                { from: '{{name}}', to: main.name, line: false },
                { from: '{{website}}', to: main.website, line: false },
                { from: '{{content}}', to: main.content, line: true },
                { from: '{{unsubscriber}}', to: title, line: false },
            ];
            replacePlan.forEach((e) => {
                mailData = mailData.replace(new RegExp(e.from, 'g'), escapeHTML(e.to, e.line));
                mailTitle = mailData.replace(new RegExp(e.from, 'g'), e.to);
            });
            const info = await transporter.sendMail({
                from: $POC.guestNotify.smtpSender,
                to: parent.email,
                subject: mailTitle,
                text: htmlToText.fromString(mailData),
                html: mailData,
            });
            break;
        }
        case 2: {
            break;
        }
        default: {
            console.warn(`Unrecognized notify mode: ${$POC.guestNotify.mode}. Any value above 2 is reversed
 for future expansion and may break in later versions of Pomment.`);
            break;
        }
    }
};

module.exports = sendNotify;

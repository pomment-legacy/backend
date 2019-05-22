const nodemailer = require('nodemailer');
const escapeHTML = require('./escape');

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

            const info = await transporter.sendMail({
                from: '"Fred Foo 👻" <foo@example.com>',
                to: 'bar@example.com, baz@example.com',
                subject: 'Hello ✔',
                text: 'Hello world?',
                html: '<b>Hello world?</b>',
            });
            break;
        }
        case 2: {
            break;
        }
        default: {
            break;
        }
    }
};

module.exports = sendNotify;

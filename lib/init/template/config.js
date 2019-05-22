module.exports = () => ({
    apiHost: '127.0.0.1',
    apiPort: 5005,
    siteAdmin: {
        name: 'Alice',
        email: 'alice@example.com',
        password: '',
    },
    guestNotify: {
        mode: 0,
        smtpHost: 'example.com',
        smtpPort: 465,
        smtpUsername: 'username',
        smtpPassword: 'password',
        smtpSecure: false,
        title: '[YOUR_SITENAME] {{name}}, you got a new reply!',
    },
    reCAPTCHA: {
        enabled: false,
        siteKey: '',
        secretKey: '',
        minimumScore: 0.1,
    },
    underProxy: false,
    webhookPassword: '',
});

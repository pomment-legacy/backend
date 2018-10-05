module.exports = {
    apiHost: '127.0.0.1',
    apiPort: 5005,
    siteName: 'Yet another blog',
    siteURL: 'https://example.com',
    siteAdmin: {
        name: 'Alice',
        email: 'alice@example.com',
        password: '',
    },
    email: {
        enabled: false,
        transport: {
            host: 'smtp.example.com',
            port: 465,
            secure: true,
            auth: {
                user: 'alice',
                pass: '12345678',
            },
        },
        sender: 'alice@example.com',
        replyTitle: '[{{siteTitle}}] {{masterName}}, Your post got a reply!',
    },
    salt: '',
    badUserInfo: {
        name: ['alice'],
        email: ['alice@example.com'],
    },
    allowedOrigin: ['https://example.com'],
    reCAPTCHA: {
        enabled: false,
        siteKey: '',
        secretKey: '',
    },
};

module.exports = () => ({
    apiHost: '127.0.0.1',
    apiPort: 5005,
    siteName: 'Yet another blog',
    siteURL: 'https://example.com',
    siteAdmin: {
        name: 'Alice',
        email: 'alice@example.com',

        // Example:
        //    12345678
        // => ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64fsaltvalue
        // => bff9baba7249c5c11d0603dcc7b0436c5f6c207e9659e0296717ac4e8429afc9
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
        receiptTitle: '[{{siteTitle}}] {{name}}, We received your comment!',
        replyTitle: '[{{siteTitle}}] {{masterName}}, Your post got a reply!',
    },
    salt: '',
    reCAPTCHA: {
        enabled: false,
        siteKey: '',
        secretKey: '',
        minimumScore: 0.1,
    },
    apiKey: null,
});

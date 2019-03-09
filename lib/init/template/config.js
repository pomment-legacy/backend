module.exports = () => ({
    apiHost: '127.0.0.1',
    apiPort: 5005,
    siteAdmin: {
        name: 'Alice',
        email: 'alice@example.com',
        password: '',
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

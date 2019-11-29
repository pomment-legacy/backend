export interface IConfig {
    apiHost: string;
    apiPort: number;
    siteAdmin: {
        name: string;
        email: string;
    };
    guestNotify: {
        mode: number;
        smtpSender: string;
        smtpHost: string;
        smtpPort: number;
        smtpUsername: string;
        smtpPassword: string;
        smtpSecure: boolean;
        title: string;
    };
    reCAPTCHA: {
        enabled: boolean;
        secretKey: string;
        minimumScore: number;
    };
    antiSpamProvider: boolean;
}

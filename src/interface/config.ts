export interface IConfig {
    apiHost: string;
    apiPort: number;
    siteAdmin: {
        name: string;
        email: string;
    };
    guestNotify: {
        mode: NotifyType;
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
    callback: [];
    antiSpamProvider: boolean;
}

export enum NotifyType {
    disabled = 1,
    smtp = 2,
    mailgun = 3,
}

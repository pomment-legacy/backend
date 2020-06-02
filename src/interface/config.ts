export interface IConfig {
    apiHost: string;
    apiPort: number;
    siteAdmin: {
        name: string;
        email: string;
        password: string;
    };
    guestNotify: {
        mode: NotifyType;
        smtpSender: string;
        smtpHost: string;
        smtpPort: number;
        smtpUsername: string;
        smtpPassword: string;
        smtpSecure: boolean;
        mailgunAPIKey: string;
        mailgunDomain: string;
        title: string;
    };
    reCAPTCHA: {
        enabled: boolean;
        secretKey: string;
        minimumScore: number;
    };
    webhook: {
        enabled: boolean;
        targets: IWebhookItem[];
    }
}

export interface IWebhookItem {
    url: string;
    token: string | null;
}
export enum NotifyType {
    smtp = 'smtp',
    mailgun = 'mailgun',
}

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
    disabled = 1,
    smtp = 2,
    mailgun = 3,
}

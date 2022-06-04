export interface PommentWebhookItem {
    url: string;
    token: string | null;
}

// eslint-disable-next-line no-shadow
export enum PommentNotifyType {
    smtp = 'smtp',
    mailgun = 'mailgun',
    none = 'none'
}

export interface PommentConfig {
    apiHost: string;
    apiPort: number;
    apiURL: string;
    siteAdmin: {
        name: string;
        email: string;
        password: string;
        secret: string;
    };
    guestNotify: {
        title: string;
        mode: PommentNotifyType;
        smtpSender: string;
        smtpHost: string;
        smtpPort: number;
        smtpUsername: string;
        smtpPassword: string;
        smtpSecure: boolean;
        mailgunAPIKey: string;
        mailgunDomain: string;
    };
    reCAPTCHA: {
        enabled: boolean;
        secretKey: string;
        minimumScore: number;
    };
    webhook: {
        enabled: boolean;
        targets: PommentWebhookItem[];
    }
}

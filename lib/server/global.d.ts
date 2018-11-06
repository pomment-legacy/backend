interface SiteAdmin {
    name: string;
    email: string;
    password: string;
}

interface EmailAuth {
    user: string;
    pass: string;
}

interface EmailTransport {
    host: string;
    port: number;
    secure: string;
    auth: EmailAuth;
}

interface Email {
    enabled: boolean;
    transport: EmailTransport;
    sender: string;
    receiptTitle: string;
    replyTitle: string;
}

interface ReCAPTCHA {
    enabled: boolean;
    siteKey: string;
    secretKey: string;
    minimumScore: number;
}

declare namespace $POC {
    const apiHost: string;
    const apiPort: number;
    const siteName: string;
    const siteURL: string;
    const siteAdmin: SiteAdmin;
    const email: Email;
    const salt: string;
    const reCAPTCHA: ReCAPTCHA;
    const apiKey: string;
    const underProxy: boolean;
}
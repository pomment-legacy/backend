interface SiteAdmin {
    /**
     * 网站管理员的昵称
     */
    name: string;
    /**
     * 网站管理员的电子邮箱地址
     */
    email: string;
    /**
     * 网站管理员的密码
     */
    password: string;
}

interface EmailAuth {
    /**
     * 电子邮箱帐号的用户名
     */
    user: string;
    /**
     * 电子邮箱帐号的密码
     */
    pass: string;
}

interface EmailTransport {
    /**
     * 电子邮箱帐号的主机
     */
    host: string;
    /**
     * 电子邮箱帐号的端口
     */
    port: number;
    /**
     * 电子邮箱帐号是否使用安全连接
     */
    secure: string;
    /**
     * 电子邮箱帐号的验证信息
     */
    auth: EmailAuth;
}

interface Email {
    /**
     * 是否启用电子邮箱功能
     */
    enabled: boolean;
    /**
     * 电子邮箱的发信方式
     */
    transport: EmailTransport;
    /**
     * 电子邮箱显示的发件人
     */
    sender: string;
    /**
     * 回执邮件标题
     */
    receiptTitle: string;
    /**
     * 回复提醒邮件标题
     */
    replyTitle: string;
}

interface ReCAPTCHA {
    /**
     * 是否启用 reCAPTCHA v3
     */
    enabled: boolean;
    /**
     * reCAPTCHA v3 的 Site Key
     */
    siteKey: string;
    /**
     * reCAPTCHA v3 的 Secret Key
     */
    secretKey: string;
    /**
     * 访客提交的最低分数限制
     */
    minimumScore: number;
}

declare namespace $POC {
    /**
     * API 服务器所监听的 IP 地址
     */
    const apiHost: string;
    /**
     * API 服务器所监听的端口
     */
    const apiPort: number;
    /**
     * 本站名称，用于电子邮件的标题
     */
    const siteName: string;
    /**
     * 本站 URL
     */
    const siteURL: string;
    /**
     * API 服务器管理员配置
     */
    const siteAdmin: SiteAdmin;
    /**
     * API 服务器电子邮件配置
     */
    const email: Email;
    /**
     * API 服务器的盐
     */
    const salt: string;
    /**
     * API 服务器 reCAPTCHA v3 配置
     */
    const reCAPTCHA: ReCAPTCHA;
    /**
     * API 服务器的 API 密钥（加盐的）
     */
    const apiKey: string;
    /**
     * API 服务器是否在代理下运行。该设置会影响日志中访客 IP 地址的精确性
     */
    const underProxy: boolean;
}

declare namespace $POM {
    /**
     * 服务器是否运行在开发模式
     */
    const isDev: boolean;
    /**
     * 服务器的日志输出级别
     */
    const logLevel: boolean;
}
import axios from 'axios';

export interface SiteVerifyRequest {
    secret: string
    response: string
    remoteip?: string
}

export interface SiteVerifyResponse {
    /**
     * whether this request was a valid reCAPTCHA token for your site
     */
    success: boolean
    /**
     * the score for this request (0.0 - 1.0)
     */
    score: number
    /**
     * the action name for this request (important to verify)
     */
    action: string
    /**
     * timestamp of the challenge load (ISO format yyyy-MM-dd'T'HH:mm:ssZZ)
     */
    'challenge_ts': string
    /**
     * the hostname of the site where the reCAPTCHA was solved
     */
    hostname: string,
    'error-codes'?: string
}

export async function siteVerify(data: SiteVerifyRequest): Promise<SiteVerifyResponse> {
    let params = `secret=${encodeURIComponent(data.secret)}&response=${encodeURIComponent(data.response)}`;
    if (data.remoteip) {
        params += `&remoteip=${encodeURIComponent(data.remoteip)}`;
    }
    const request = await axios.post('https://www.recaptcha.net/recaptcha/api/siteverify', params, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Pomment',
        },
    });
    return request.data;
}

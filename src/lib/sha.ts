import crypto from 'crypto';

const content = {
    compute(algorithm: string, ...str: string[]) {
        const temp = str.join('');
        const hash = crypto.createHash(algorithm);
        hash.update(temp);
        return hash.digest('hex');
    },
    sha256(...str: string[]) {
        return this.compute('sha256', ...str);
    },
    sha512(...str: string[]) {
        return this.compute('sha512', ...str);
    },
    md5(...str: string[]) {
        return this.compute('md5', ...str);
    },
};

export default content;

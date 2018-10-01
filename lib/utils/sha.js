const crypto = require('crypto');

module.exports = {
    compute(str, algorithm) {
        const temp = typeof str === 'string' ? str : String(str);
        const hash = crypto.createHash(algorithm);
        hash.update(temp);
        return hash.digest('hex');
    },
    sha256(str) {
        return this.compute(str, 'sha256');
    },
    md5(str) {
        return this.compute(str, 'md5');
    },
};

const crypto = require('crypto');

module.exports = {
    compute(algorithm, ...str) {
        const temp = str.join('');
        const hash = crypto.createHash(algorithm);
        hash.update(temp);
        return hash.digest('hex');
    },
    sha256(...str) {
        return this.compute('sha256', ...str);
    },
    md5(...str) {
        return this.compute('md5', ...str);
    },
};

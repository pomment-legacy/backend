const SHA = require('../../../../utils/sha');

const auth = (hash) => {
    const salted = SHA.sha256(hash, $POC.salt);
    if (salted === $POC.siteAdmin.password) {
        return true;
    }
    if ($POC.apiKey && $POC.apiKey.length >= 40 && hash === $POC.apiKey) {
        return true;
    }
    return false;
};

module.exports = auth;

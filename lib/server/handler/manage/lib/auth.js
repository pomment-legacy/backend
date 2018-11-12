const SHA = require('../../../../utils/sha');

const auth = (hash) => {
    const salted = SHA.sha256(hash, $POC.salt);
    return salted === $POC.siteAdmin.password || salted === $POC.apiKey;
};

module.exports = auth;

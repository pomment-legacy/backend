/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

const safeRequire = (moduleName) => {
    try {
        return require(moduleName);
    } catch (e) {
        return null;
    }
};

module.exports = safeRequire;

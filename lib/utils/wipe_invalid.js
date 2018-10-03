/* eslint-disable no-param-reassign */

const wipeInvalid = (obj) => {
    const keys = Object.keys(obj);
    keys.forEach((e) => {
        if (obj[e] === undefined || obj[e] === null) {
            delete obj[e];
        }
    });
    return obj;
};

module.exports = wipeInvalid;

const path = require('path');

const pommentData = require('../core/data');

module.exports = (userPath = process.cwd()) => {
    const computedPath = path.resolve(process.cwd(), userPath);
    pommentData.init(computedPath);
};

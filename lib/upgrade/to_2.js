/* eslint-disable no-param-reassign */

const fs = require('fs-extra');
const path = require('path');

const toVersion2 = (dir) => {
    const files = fs.readdirSync(path.resolve(dir, 'threads'));
    const jsonFiles = files.filter((e) => e.slice(-5) === '.json');
    jsonFiles.forEach((e) => {
        const filePath = path.resolve(dir, 'threads', e);
        const content = fs.readJSONSync(filePath, { encoding: 'utf8' });
        content.forEach((f) => {
            f.avatar = null;
            f.rating = null;
        });
        fs.writeJSONSync(filePath, content, { encoding: 'utf8', spaces: 4 });
    });
};

module.exports = toVersion2;

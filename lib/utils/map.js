const fs = require('fs-extra');

class MapFromFile extends Map {
    constructor(fileName, keyName = 'key', valueName = 'value') {
        const data = fs.readJSONSync(fileName, { encoding: 'utf8' });
        const newData = [];
        while (data.length) {
            const temp = data.pop();
            newData.push([temp[keyName], temp[valueName]]);
        }
        super(newData);
        /**
         * 源文件名
         * @type {string}
         * @private
         */
        this._fileName = fileName;
        /**
         * 在 JSON 文件中的键的别名
         * @type {string}
         * @private
         */
        this._keyName = keyName;
        /**
         * 在 JSON 文件中的值的别名
         * @type {string}
         * @private
         */
        this._valueName = valueName;
    }

    save() {
        const data = [...this];
        const newData = [];
        while (data.length) {
            const temp = data.pop();
            const tempObject = {};
            tempObject[this._keyName] = temp[0];
            tempObject[this._valueName] = temp[1];
            newData.push(tempObject);
            fs.writeJSONSync(this._fileName, newData, { encoding: 'utf8', spaces: 4 });
        }
    }

    reload() {
        const data = fs.readJSONSync(this._fileName, { encoding: 'utf8' });
        this.clear();
        while (data.length) {
            const temp = data.pop();
            this.set(temp[this._keyName], temp[this._valueName]);
        }
    }

    setAndSave(key, value) {
        const res = this.set(key, value);
        this.save();
        return res;
    }

    deleteAndSave(key) {
        const res = this.delete(key);
        this.save();
        return res;
    }

    clearAndSave() {
        this.clear();
        this.save();
    }
}

module.exports = MapFromFile;

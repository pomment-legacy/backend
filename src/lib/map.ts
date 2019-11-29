import fs from "fs-extra";

class MapFromFile {
    constructor(fileName: string, keyName = "key", valueName = "value") {
        const data = fs.readJSONSync(fileName, { encoding: "utf8" });
    }
}

export default MapFromFile;

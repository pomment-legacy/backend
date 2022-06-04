import fs from 'fs-extra';
import path from 'path';
import { PommentThreadMetadata } from '@/types/post';

const fsOpts = { encoding: 'utf8' };

// eslint-disable-next-line import/prefer-default-export
export class PommentData {
    static MAIN_UUID = '91729628-42c2-4e60-8a45-593403a3ac67';

    public workingDir: string;

    private indexMap: Map<string, PommentThreadMetadata>;

    constructor(workingDir: string) {
        this.workingDir = workingDir;
        this.indexMap = new Map<string, PommentThreadMetadata>(fs.readJSONSync(path.join(workingDir, 'index.json'), fsOpts));
    }

    public static getThreadFileName(url: string, ext = 'json') {
        const newURL = encodeURIComponent(url).replace(/\*/g, '%2A');
        let newName = `${newURL}.${ext}`;
        if (newName.length > 255) {
            newName = newName.slice(newName.length - 255);
        }
        return newName;
    }
}

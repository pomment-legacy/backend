import fs from 'fs-extra';
import path from 'path';
import log4js from 'log4js';
import { IThreadItem, IPostQueryResults } from 'pomment-common/dist/interface/post';
import { PommentData } from '../core/main';

const fsOpts = { encoding: 'utf8' };

interface IOldAttr {
    url: string;
    attributes: {
        title: string;
    }
}

interface IStatus {
    dataVer: number;
}

function upgrade3(entry: string) {
    const logger = log4js.getLogger('Main');
    const logLevel = process.env.PMNT_LOG_LEVEL || 'info';
    logger.level = logLevel;

    const status: IStatus = fs.readJSONSync(path.join(entry, 'status.json'), fsOpts);
    if (status.dataVer === 3) {
        logger.error('You are already upgraded to v3 data format.');
        return;
    }
    if (status.dataVer !== 2) {
        logger.error('Unsupported data format version.');
        return;
    }
    logger.info('Renaming mail template file');
    fs.moveSync(path.join(entry, 'mail_notify.html'), path.join(entry, 'mail_template.html'));

    logger.info('Upgrading index.json to v3 format');
    const dataOld: IOldAttr[] = fs.readJSONSync(path.join(entry, 'index.json'), fsOpts);
    const data: Map<string, IThreadItem> = new Map();
    dataOld.forEach((e) => {
        const threadPath = PommentData.getThreadFileName(e.url);
        const thread: IPostQueryResults[] = fs.readJSONSync(path.join(entry, 'threads', threadPath), fsOpts);
        let amount = 0;
        let latestPostAt = 0;
        thread.forEach((f) => {
            if (!f.hidden) {
                amount += 1;
                if (f.createdAt > latestPostAt) {
                    latestPostAt = f.createdAt;
                }
            }
        });
        const item: IThreadItem = {
            title: e.attributes.title,
            latestPostAt,
            amount,
        };
        data.set(e.url, item);
    });
    fs.writeJSONSync(path.join(entry, 'index.json'), [...data], fsOpts);

    status.dataVer = 3;
    fs.writeJSONSync(path.join(entry, 'status.json'), status, fsOpts);
}

export default upgrade3;

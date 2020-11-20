/* eslint-disable no-param-reassign */
import fs from 'fs-extra';
import path from 'path';
import log4js from 'log4js';
import { IThreadItem, IPostQueryResults } from '../interface/post';
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
    const logger = log4js.getLogger('Upgrader');
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

    logger.info('Upgrading thread data to v3 format');
    const dataOld: IOldAttr[] = fs.readJSONSync(path.join(entry, 'index.json'), fsOpts);
    const data: Map<string, IThreadItem> = new Map();
    let total = {
        all: 0,
        displayed: 0,
    };
    dataOld.forEach((e) => {
        const threadPath = PommentData.getThreadFileName(e.url);
        const thread: IPostQueryResults[] = fs.readJSONSync(path.join(entry, 'threads', threadPath), fsOpts);
        let amount = 0;
        let latestPostAt = 0;
        thread.forEach((f) => {
            total.all += 1;
            if (!f.hidden) {
                total.displayed += 1;
                amount += 1;
                if (f.createdAt > latestPostAt) {
                    latestPostAt = f.createdAt;
                }
            }
            if (f.rating !== null && Number.isNaN(Number(f.rating))) {
                f.rating = null;
            }
        });
        fs.writeJSONSync(path.join(entry, 'threads', threadPath), thread, { ...fsOpts, spaces: 4 });
        const item: IThreadItem = {
            title: e.attributes.title,
            latestPostAt,
            amount,
        };
        data.set(e.url, item);
    });
    logger.info(`${total.all} comments upgraded (${total.displayed} is displayed in public)`);

    logger.info('Upgrading index.json data format');
    fs.writeJSONSync(path.join(entry, 'index.json'), [...data], fsOpts);

    logger.info('Upgrading status.json');
    status.dataVer = 3;
    fs.writeJSONSync(path.join(entry, 'status.json'), status, fsOpts);
}

export default upgrade3;

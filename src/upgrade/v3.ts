/* eslint-disable no-param-reassign */
import fs from 'fs-extra';
import path from 'path';
import log4js from 'log4js';
import yaml from 'js-yaml';
import { v5 as uuidv5 } from 'uuid';
import { IThreadItem, IPostQueryResults } from '../types/post';
import { PommentData } from '../core/main';
import { PommentConfig, PommentNotifyType } from '../types/config';

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
    const logLevel = process.env.NODE_ENV === 'development' ? 'debug' : 'info';
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
    logger.info('Upgrading config file');
    const oldConfig = fs.readJSONSync(path.join(entry, 'config.json'), fsOpts);
    delete oldConfig.reCAPTCHA.siteKey;

    const newConfig: PommentConfig = {
        apiHost: oldConfig.apiHost,
        apiPort: oldConfig.apiPort,
        apiURL: 'http://example.com',
        siteAdmin: oldConfig.siteAdmin,
        reCAPTCHA: oldConfig.reCAPTCHA,
        guestNotify: {
            mode: PommentNotifyType.none,
            title: '',
            smtpSender: '',
            smtpHost: '',
            smtpPort: 0,
            smtpUsername: '',
            smtpPassword: '',
            smtpSecure: false,
            mailgunAPIKey: '',
            mailgunDomain: '',
        },
        webhook: {
            enabled: false,
            targets: [],
        },
    };
    fs.writeFileSync(path.join(entry, 'config.yaml'), yaml.dump(newConfig), { encoding: 'utf-8' });

    logger.info('Renaming mail template file');
    fs.moveSync(path.join(entry, 'mail_notify.html'), path.join(entry, 'mail_template.html'));

    logger.info('Upgrading thread data to v3 format');
    const dataOld: IOldAttr[] = fs.readJSONSync(path.join(entry, 'index.json'), fsOpts);
    const data: Map<string, IThreadItem> = new Map();
    const total = {
        all: 0,
        displayed: 0,
    };
    dataOld.forEach((e) => {
        const threadPath = PommentData.getThreadFileName(e.url);
        const thread: IPostQueryResults[] = fs.readJSONSync(path.join(entry, 'threads', threadPath), fsOpts);
        let amount = 0;
        let firstPostAt = Number.MAX_SAFE_INTEGER;
        let latestPostAt = 0;
        logger.info(`Upgrading data of thread ${e.attributes.title} (${e.url})`);
        thread.forEach((f) => {
            total.all += 1;

            // 寻找最后发布的公开评论的时间
            if (!f.hidden) {
                total.displayed += 1;
                amount += 1;
                if (f.createdAt > latestPostAt) {
                    latestPostAt = f.createdAt;
                }
            }

            // 修正 v2 数据问题
            if (f.rating !== null && Number.isNaN(Number(f.rating))) {
                f.rating = null;
            }

            // 寻找最早发布评论的时间
            firstPostAt = Math.min(firstPostAt, f.createdAt);
        });

        // 设置评论串的 UUID
        const threadUUID = uuidv5(`pomment_${firstPostAt}`, PommentData.MAIN_UUID);

        // 为每篇评论分配 UUID
        thread.forEach((f: any) => {
            f.uuid = uuidv5(`pomment_${f.id}`, threadUUID);
            delete f.id;
            if (f.parent < 0) {
                f.parent = null;
                return;
            }
            f.parent = uuidv5(`pomment_${f.parent}`, threadUUID);
        });

        // 设置评论串的属性
        const item: IThreadItem = {
            uuid: threadUUID,
            title: e.attributes.title,
            firstPostAt,
            latestPostAt,
            amount,
        };

        // 写入到键值对中
        data.set(e.url, item);

        // 保存更新的评论
        fs.writeJSONSync(path.join(entry, 'threads', threadPath), thread, { ...fsOpts, spaces: 4 });
    });
    logger.info(`${total.all} comments upgraded (${total.displayed} is displayed in public)`);

    logger.info('Upgrading index data');
    fs.writeJSONSync(path.join(entry, 'index.json'), [...data], { ...fsOpts, spaces: 4 });

    logger.info('Upgrading status.json');
    status.dataVer = 3;
    fs.writeJSONSync(path.join(entry, 'status.json'), status, fsOpts);
}

export default upgrade3;

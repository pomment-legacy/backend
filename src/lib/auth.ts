import crypto from 'crypto';
import log4js from 'log4js';

const logLevel = process.env.PMNT_LOG_LEVEL || 'info';

export class Auth {
    private password: string;

    private timer: NodeJS.Timeout | null;

    private queue: number[];

    private logger: log4js.Logger;

    static maxTimeGap = 120;

    constructor(password: string) {
        this.logger = log4js.getLogger('Auth');
        this.logger.level = logLevel;
        this.password = password;
        this.timer = null;
        this.queue = [];
    }

    auth(time: number, token: string): boolean {
        if (typeof time !== 'number' || typeof token !== 'string') {
            this.logger.error('Invaild arguments');
            return false;
        }

        const userTimestamp = time;
        const sysTimestamp = new Date().getTime();
        const gap = Math.abs(userTimestamp - sysTimestamp) / 1000;
        this.logger.debug(`userTimestamp: ${userTimestamp}, sysTimestamp: ${sysTimestamp}, gap: ${gap}`);

        if (gap > Auth.maxTimeGap) {
            this.logger.error('Timestamp expired');
            return false;
        }
        const correct = crypto.createHmac('sha512', this.password).update(`${userTimestamp}`).digest('hex');
        this.logger.debug(`correct: ${correct}`);

        if (correct !== token) {
            this.logger.error('Bad password');
            return false;
        }

        if (this.queue.includes(userTimestamp)) {
            this.logger.error('Timestamp is used before');
            return false;
        }

        this.queue.push(userTimestamp);
        if (this.timer === null) {
            this.logger.debug('Creating queue cleaning task');
            this.timer = setTimeout(this.cleanQueue.bind(this), Auth.maxTimeGap * 1000);
        } else {
            this.logger.debug('Already having cleaning task, skipping creation');
        }

        return true;
    }

    cleanQueue() {
        const sysTimestamp = new Date().getTime();
        let removed = 0;
        for (let i = this.queue.length - 1; i >= 0; i--) {
            const gap = Math.abs(this.queue[i] - sysTimestamp) / 1000;
            if (gap > Auth.maxTimeGap) {
                this.queue.splice(i, 1);
                removed += 1;
            }
        }
        this.logger.debug(`Removed ${removed} used timestamps`);
        this.logger.debug(`${this.queue.length} used timestamps left`);
        if (this.queue.length > 0) {
            this.timer = setTimeout(this.cleanQueue.bind(this), Auth.maxTimeGap * 1000);
            return;
        }
        this.timer = null;
    }
}

export interface IAuth {
    time: number;
    token: string;
}

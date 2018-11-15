const childProcess = require('child_process');
const defer = require('nyks/promise/defer');
const drain = require('nyks/stream/drain');

const checkAvailable = () => {
    const isDialog = childProcess.spawnSync('which', ['dialog']).stdout.toString('utf8').trim();
    const isWhiptail = childProcess.spawnSync('which', ['whiptail']).stdout.toString('utf8').trim();
    if (isDialog) {
        return 'dialog';
    }
    if (isWhiptail) {
        return 'whiptail';
    }
    console.error('No dialog program found. Please install dialog or whiptail '
        + 'for using this tool, or just edit your config.json by hand.');
    process.exit(1);
    return null;
};

const exec = (command, args, options) => {
    const child = childProcess.spawn(command, args, options);
    const next = defer();
    child.on('error', next.reject);
    child.on('exit', async (code) => {
        if (code !== 0) {
            return next.reject(`Bad exit code ${code}`);
        }
        const body = await drain(child.stderr);
        next.resolve(`${body}`);
        return undefined;
    });
    return next;
};

const whiptail = {
    program: checkAvailable(),
    title: ['--title', 'Pomment'],
    opts: { stdio: ['inherit', 'inherit', 'pipe'] },
    get size() {
        return [10, process.stdout.columns - 10];
    },
    async inputbox(msg, value) {
        try {
            const result = await exec(this.program, [...this.title, '--inputbox', msg, ...this.size, value], this.opts);
            return result;
        } catch (e) {
            return null;
        }
    },
    async passwordbox(msg, value) {
        try {
            const result = await exec(this.program, [...this.title, '--passwordbox', msg, ...this.size, value], this.opts);
            return result;
        } catch (e) {
            return null;
        }
    },
    async yesno(msg) {
        try {
            await exec(this.program, [...this.title, '--yesno', msg, ...this.size], this.opts);
            return true;
        } catch (e) {
            return false;
        }
    },
    async msgbox(msg) {
        try {
            await exec(this.program, [...this.title, '--msgbox', msg, ...this.size], this.opts);
            return true;
        } catch (e) {
            return false;
        }
    },
    async menu(msg, items) {
        try {
            const itemKeys = Object.keys(items);
            const options = [];
            for (let i = 0; i < itemKeys.length; i += 1) {
                options.push(itemKeys[i], items[itemKeys[i]]);
            }
            const result = await exec(this.program, [...this.title, '--no-tags', '--menu', msg, 0, 0, 0, ...options], this.opts);
            return result;
        } catch (e) {
            return null;
        }
    },
};

module.exports = whiptail;

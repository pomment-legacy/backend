const fs = require('fs');
const assert = require('assert');
const log4js = require('log4js');

const PommentData = require('../lib/core/');

const logger = log4js.getLogger('PommentData');
logger.level = 'debug';

describe('Class: PommentData', () => {
    describe('init', () => {
        it('should return a PommentData instance', async () => {
            const pommentData = await PommentData.init('.temp');
            assert(pommentData instanceof PommentData, true);
        });
    });
    describe('construct', () => {
        it('should be constructed', () => {
            const pommentData = new PommentData('.temp');
            assert(pommentData instanceof PommentData, true);
        });
    });
    describe('post', () => {
        it('should add a new thread and a new post', async () => {
            const pommentData = new PommentData('.temp');
            logger.info(await pommentData.addPost(
                'https://example.com/post',
                'tcdw',
                'admin@example.com',
                'https://example.com',
                'test the content',
                undefined,
                false,
                false,
                false,
            ));
        });
        it('should add a new post to existed thread', async () => {
            const pommentData = new PommentData('.temp');
            logger.info(await pommentData.addPost(
                'https://example.com/post',
                'tcdw',
                'admin@example.com',
                'https://example.com',
                'test the content again',
                1,
                false,
                false,
                false,
            ));
        });
        it('should be able to lock / unlock and detect lock status', async () => {
            const pommentData = new PommentData('.temp');
            pommentData.setThreadLock('https://example.com/post', true);
            assert(fs.existsSync(pommentData.getThreadPath('https://example.com/post', undefined, 'lock')), true);
            try {
                await pommentData.addPost(
                    'https://example.com/post',
                    'tcdw',
                    'admin@example.com',
                    'https://example.com',
                    'test the content again',
                    1,
                    false,
                    false,
                    false,
                    { verifyLocked: true },
                );
            } catch (e) {
                if (e.toString() !== 'Error: Thread locked') {
                    throw e;
                }
            }
            pommentData.setThreadLock('https://example.com/post', false);
            assert(!fs.existsSync(pommentData.getThreadPath('https://example.com/post', undefined, 'lock')), true);
            await pommentData.addPost(
                'https://example.com/post',
                'tcdw',
                'admin@example.com',
                'https://example.com',
                'test the content again',
                1,
                false,
                false,
                false,
                { verifyLocked: true },
            );
        });
    });
});

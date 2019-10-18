const fs = require('fs');
const assert = require('assert');
const log4js = require('log4js');

const PommentData = require('pomment-core');

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
                    0,
                    { verifyLocked: true },
                );
            } catch (e) {
                if (e.toString() !== 'Error: This thread is already locked and verifyLocked is enabled') {
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
                0,
                { verifyLocked: true },
            );
        });
        it('should be able to do user editing operation', async () => {
            const pommentData = new PommentData('.temp');
            const { id, editKey } = await pommentData.addPost(
                'https://example.com/post',
                'tcdw',
                'admin@example.com',
                'https://example.com',
                'test the content again',
                1,
                false,
                false,
                false,
                0,
                { verifyLocked: true },
            );
            await pommentData.editPostUser('https://example.com/post', id, 'i am edited!', editKey, false);
            const result = await pommentData.getPost('https://example.com/post', id);
            assert(result.content === 'i am edited!', true);
        });
    });
    describe('thread', () => {
        it('should be able to add titles to list', async () => {
            const pommentData = new PommentData('.temp');
            await pommentData.addThreadTitle('https://example.com/post', 'derp');
        });
        it('should be able to give the list', () => {
            const pommentData = new PommentData('.temp');
            logger.info(JSON.stringify(pommentData.getThreads(), null, 4));
        });
        it('should be able to get attribute of a thread', () => {
            const pommentData = new PommentData('.temp');
            logger.info(JSON.stringify(pommentData.getThreadAttribute('https://example.com/post'), null, 4));
        });
    });
});

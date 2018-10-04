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
    describe('addPost', () => {
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
    });
});

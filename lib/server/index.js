/* eslint-disable global-require */

const fs = require('fs-extra');
const path = require('path');
const Koa = require('koa');
const koaBody = require('koa-body');
const koaJSON = require('koa-json');
const koaLogger = require('koa-logger');
const koaRouter = require('koa-router')();
const log4js = require('log4js');
const PommentData = require('pomment-core');
const base64url = require('base64url');
const bodyLogger = require('../utils/body-logger');
const executeWebhook = require('../webhook/execute');
const sendNotify = require('../notify/index');
const auth = require('./auth');
const reCAPTCHA = require('./recaptcha');

module.exports = (userPath = process.cwd()) => {
    const $POM = {};
    $POM.path = path.resolve(process.cwd(), userPath);
    const $POC = fs.readJSONSync(path.join($POM.path, 'config.json'), { encoding: 'utf8' });
    const $POD = new PommentData($POM.path);
    $POM.isDev = process.env.NODE_ENV === 'development';
    $POM.logLevel = $POM.isDev ? 'debug' : 'info';
    $POM.path = null;
    koaRouter.post('/v2/list', async (ctx) => {
        const logger = log4js.getLogger('Server: /v2/list');
        logger.level = $POM.logLevel;
        const { body } = ctx.request;
        try {
            ctx.response.body = {
                url: body.url,
                locked: $POD.getThreadLock(body.url),
                content: await $POD.getPosts(body.url, {
                    outputEmailHash: true,
                    includeHidden: false,
                }),
            };
        } catch (e) {
            logger.info(`Catched: ${e.toString()}`);
            ctx.response.body = {
                url: body.url,
                locked: false,
                content: [],
            };
        }
    });

    koaRouter.post('/v2/submit', async (ctx) => {
        const logger = log4js.getLogger('Server: /v2/submit');
        logger.level = $POM.logLevel;
        const { body } = ctx.request;
        let negative = 0;
        if (body.email.trim() === '') {
            logger.error('Email address is empty or only have whitespace characters');
            negative += 1;
        }
        if (!/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(body.email.trim())) {
            logger.error('Email address is illegal');
            negative += 1;
        }
        if (body.content.trim() === '') {
            logger.error('Content is empty or only have whitespace characters');
            negative += 1;
        }
        if (body.content.trim().replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '_').length > 1000) {
            logger.error('Content\'s length is more than 1000 characters');
            negative += 1;
        }
        if (typeof body.parent !== 'number') {
            logger.error('Parent value is not number');
            negative += 1;
        }
        if (typeof body.receiveEmail !== 'boolean') {
            logger.error('ReceiveEmail value is not boolean');
            negative += 1;
        }
        if (negative > 0) {
            ctx.status = 500;
            return false;
        }
        let query;
        try {
            const finalName = body.name.trim() || null;
            const finalWebsite = body.website.trim() || null;
            query = await $POD.addPost(
                body.url,
                finalName,
                body.email.trim(),
                finalWebsite,
                body.content.trim(),
                body.parent,
                body.receiveEmail,
                false,
                false,
                { verifyLocked: true },
            );
            const {
                id, name, email, website, parent, content, editKey, createdAt, updatedAt,
            } = query;
            const userResult = {
                id, name, email, website, parent, content, editKey, createdAt, updatedAt,
            };
            ctx.response.body = userResult;
        } catch (e) {
            logger.error(e.toString());
            ctx.status = 500;
            return false;
        }
        let reCAPTCHAScore = null;
        setTimeout(async () => {
            logger.info('Adding thread title');
            $POD.addThreadTitle(body.url, body.title);
            logger.info('Verifying user request');
            if ($POC.reCAPTCHA.enabled) {
                const result = await reCAPTCHA($POC.reCAPTCHA.secretKey, body.responseKey, logger);
                reCAPTCHAScore = result.score;
                if (result.hidden) {
                    await $POD.editPost(body.url, query.id, {
                        hidden: true,
                    }, {
                        prevertUpdateTime: true,
                    });
                }
            }
            logger.info('Handling webhooks');
            const thisParent = await $POD.getPost(body.url, body.parent);
            const title = $POD.getThreadAttribute(body.url).title;
            const webhookResult = {
                event: 'new_comment',
                url: body.url,
                title,
                content: { ...query, reCAPTCHAScore, parentContent: thisParent },
            };
            await executeWebhook(webhookResult, logger);
            if (thisParent && thisParent.receiveEmail) {
                logger.info('Sending notify (if enabled)');
                await sendNotify(logger, body.url, title, thisParent, query);
            }
            logger.info('Background task finished');
        }, 0);
        return true;
    });

    koaRouter.post('/v2/edit', async (ctx) => {
        const logger = log4js.getLogger('Server: /v2/edit');
        logger.level = $POM.logLevel;
        const { body } = ctx.request;
        let reCAPTCHAScore = null;
        if ($POC.reCAPTCHA.enabled) {
            const result = await reCAPTCHA($POC.reCAPTCHA.secretKey, body.responseKey, logger);
            reCAPTCHAScore = result.score;
            if (!result.hidden) {
                await $POD.editPostUser(body.url, body.id, body.content, body.editKey);
            }
        }
        ctx.response.body = '';
        setTimeout(async () => {
            logger.info('Handling webhooks');
            const webhookResult = {
                event: 'edit_comment',
                url: body.url,
                title: body.title,
                content: { ...(await $POD.getPost(body.url, body.id)), reCAPTCHAScore },
            };
            await executeWebhook(webhookResult, logger);
            logger.info('Background task finished');
        }, 0);
        return true;
    });

    koaRouter.post('/v2/delete', async (ctx) => {
        const logger = log4js.getLogger('Server: /v2/delete');
        logger.level = $POM.logLevel;
        const { body } = ctx.request;
        await $POD.editPostUser(body.url, body.id, null, body.editKey, true);
        ctx.response.body = '';
    });

    koaRouter.post('/v2/manage/submit', async (ctx) => {
        const logger = log4js.getLogger('Server: /v2/manage/submit');
        logger.level = $POM.logLevel;
        const { body } = ctx.request;
        if (!auth(body.token, `submit ${body.url} -1`, body.time, $POC.siteAdmin.password)
            || $POC.apiKey === null
            || body.token !== $POC.apiKey) {
            logger.error('Failed to verify');
            ctx.status = 500;
            return false;
        }
        let query;
        try {
            if (body.parent >= 0) {
                await $POD.editPost(body.url, body.parent, {
                    hidden: false,
                }, {
                    prevertUpdateTime: true,
                });
            }
            query = await $POD.addPost(
                body.url,
                $POC.siteAdmin.name,
                $POC.siteAdmin.email,
                null,
                body.content.trim(),
                body.parent,
                body.receiveEmail,
                true,
                false,
            );
            const {
                id, parent, content, createdAt, updatedAt,
            } = query;
            const userResult = {
                id, parent, content, createdAt, updatedAt,
            };
            ctx.response.body = userResult;
        } catch (e) {
            logger.error(e.toString());
            ctx.status = 500;
            return false;
        }
        setTimeout(async () => {
            logger.info('Adding thread title');
            $POD.addThreadTitle(body.url, body.title);
            logger.info('Handling webhooks');
            const thisParent = await $POD.getPost(body.url, body.parent);
            const title = $POD.getThreadAttribute(body.url).title;
            const webhookResult = {
                event: 'new_comment',
                url: body.url,
                title,
                content: { ...query, reCAPTCHAScore: $POC.reCAPTCHA.enabled ? 1 : null, parentContent: thisParent },
            };
            await executeWebhook(webhookResult, logger);
            if (thisParent && thisParent.receiveEmail) {
                logger.info('Sending notify (if enabled)');
                await sendNotify(logger, body.url, title, thisParent, query);
            }
            logger.info('Background task finished');
        }, 0);
        return true;
    });
    koaRouter.post('/v2/manage/edit', async (ctx) => {
        const logger = log4js.getLogger('Server: /v2/manage/edit');
        logger.level = $POM.logLevel;
        const { body } = ctx.request;
        if (!auth(body.token, `edit ${body.url} ${body.id}`, body.time, $POC.siteAdmin.password)
            || $POC.apiKey === null
            || body.token !== $POC.apiKey) {
            logger.error('Failed to verify');
            ctx.status = 500;
            return false;
        }
        await $POD.editPostAdmin(body.url, body.id, body.content);
        ctx.response.body = '';
        return true;
    });

    koaRouter.post('/v2/manage/delete', async (ctx) => {
        const logger = log4js.getLogger('Server: /v2/manage/delete');
        logger.level = $POM.logLevel;
        const { body } = ctx.request;
        if (!auth(body.token, `delete ${body.url} ${body.id}`, body.time, $POC.siteAdmin.password)
            || $POC.apiKey === null
            || body.token !== $POC.apiKey) {
            logger.error('Failed to verify');
            ctx.status = 500;
            return false;
        }
        await $POD.editPostAdmin(body.url, body.id, null, true);
        ctx.response.body = '';
        return false;
    });

    koaRouter.get('/unsubscribe/:thread/:id/:editKey', async (ctx) => {
        const logger = log4js.getLogger('Server: /unsubscribe');
        logger.level = $POM.logLevel;
        const { thread, id, editKey } = ctx.params;
        const url = base64url.decode(thread);
        try {
            const wanted = await $POD.getPost(url, Number(id), { includeHidden: false });
            if (!wanted.editKey) {
                throw new Error('Editing this post is not allowed');
            }
            if (wanted.editKey !== editKey) {
                throw new Error('Edit key is incorrect');
            }
            await $POD.editPost(url, Number(id), {
                receiveEmail: false,
            }, {
                verifyLocked: false,
                prevertUpdateTime: true,
            });
        } catch (e) {
            logger.error(e.toString());
            ctx.response.body = '<h1>Failed to unsubscribe.</h1>';
            return;
        }
        ctx.response.body = '<h1>Unsubscribed successfully.</h1>';
    });

    koaRouter.post('*', (ctx) => {
        ctx.status = 500;
    });

    koaRouter.get('/', (ctx) => {
        ctx.response.body = null;
    });

    koaRouter.get('*', (ctx) => {
        ctx.status = 404;
        ctx.response.body = '';
    });

    koaRouter.options('*', (ctx) => {
        ctx.response.body = null;
    });

    const app = new Koa();
    const masterLogger = log4js.getLogger('Server');

    app.use(koaBody());
    app.use(koaJSON({ spaces: 4 }));
    app.use(koaLogger((str) => {
        masterLogger.info(str);
    }));
    app.use((ctx, next) => {
        if (process.env.NODE_ENV === 'development') {
            ctx.set('Access-Control-Request-Method', 'POST');
            ctx.set('Access-Control-Allow-Headers', 'Content-Type');
            ctx.set('Access-Control-Allow-Origin', '*');
        }
        bodyLogger(ctx, masterLogger);
        return next();
    });
    app.use(koaRouter.routes());
    app.listen($POC.apiPort, $POC.apiHost);
    app.proxy = $POC.underProxy;

    masterLogger.level = $POM.logLevel;
    masterLogger.info(`The HTTP server is http://${$POC.apiHost}:${$POC.apiPort}`);
};

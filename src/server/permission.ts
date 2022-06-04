import jwt from 'jsonwebtoken';
import { PommentComputedContext } from '@/server/main';
import Koa from 'koa';

export function sign(user: string, secret: string, expiresIn: string | number) {
    return jwt.sign({ user }, secret, {
        expiresIn,
    });
}

export function verify(token: string, secret: string) {
    return jwt.verify(token, secret);
}

export function checkPermission(ctx: PommentComputedContext, next: Koa.Next) {
    if (ctx.path === '/v4/admin/auth') {
        return next();
    }

    const { authorization } = ctx.headers;
    if (!authorization || !authorization.startsWith('Bearer ')) {
        ctx.body = { error: 'no token' };
        return false;
    }
    const token = authorization.slice(7);
    console.log(verify(token, ctx.$config.siteAdmin.secret));
    return next();
}

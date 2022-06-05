import jwt from 'jsonwebtoken';
import { PommentComputedContext } from '@/server/main';
import Koa from 'koa';
import { AjaxError } from '@/server/utils/wrapper';

export function sign(user: string, secret: string, expiresIn: string | number) {
    return jwt.sign({ user }, secret, {
        expiresIn,
    });
}

export function verify(token: string, secret: string) {
    return jwt.verify(token, secret);
}

export function checkPermission(ctx: PommentComputedContext, next: Koa.Next) {
    if (!ctx.path.startsWith('/v4/admin') || ctx.path === '/v4/admin/auth') {
        return next();
    }

    const { authorization } = ctx.headers;
    if (!authorization || !authorization.startsWith('Bearer ')) {
        AjaxError(ctx, 401);
        return false;
    }
    const token = authorization.slice(7);
    try {
        verify(token, ctx.$config.siteAdmin.secret);
    } catch (e) {
        AjaxError(ctx, 401);
        return false;
    }
    return next();
}

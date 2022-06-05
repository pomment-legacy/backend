import Schema, { Rules } from 'async-validator';
import * as URL from 'url';

const descriptor: Rules = {
    name: {
        type: 'string',
        required: true,
        validator: (rule, value) => value.trim() !== '',
    },
    email: {
        type: 'string',
        required: true,
        pattern: /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}])|(([a-zA-Z\-\d]+\.)+[a-zA-Z]{2,}))$/,
    },
    website: {
        type: 'string',
        validator: (rule, value) => {
            if (value.trim() === '') {
                return true;
            }
            try {
                const url = new URL.URL(value);
                return url.protocol === 'http:' || url.protocol === 'https:';
            } catch (e) {
                return false;
            }
        },
    },
    parent: {
        type: 'string',
        pattern: /(^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$)|^$/,
    },
    content: {
        type: 'string',
        required: true,
    },
    receiveEmail: {
        type: 'boolean',
        required: true,
    },
};
const validator = new Schema(descriptor);

export default async function validateUserPost(data: any) {
    try {
        await validator.validate(data);
        return true;
    } catch (e) {
        console.log('数据校验失败：', e);
        return false;
    }
}

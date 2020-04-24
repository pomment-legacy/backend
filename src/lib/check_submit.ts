import { ISubmitBody } from '../server/route/submit';

const checkSubmit = (body: ISubmitBody) => {
    if (body.email.trim() === '') {
        throw new Error('Email address is empty or only have whitespace characters');
    }
    if (!/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(body.email.trim())) {
        throw new Error('Email address is illegal');
    }
    if (body.content.trim() === '') {
        throw new Error('Content is empty or only have whitespace characters');
    }
    if (body.content.trim().replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '_').length > 1000) {
        throw new Error("Content's length is more than 1000 characters");
    }
    if (typeof body.parent !== 'number') {
        throw new Error('Parent value is not number');
    }
    if (typeof body.receiveEmail !== 'boolean') {
        throw new Error('ReceiveEmail value is not boolean');
    }
};

export default checkSubmit;

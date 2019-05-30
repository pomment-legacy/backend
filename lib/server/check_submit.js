const checkSubmit = (body, logger) => {
    if (body.email.trim() === '') {
        logger.error('Email address is empty or only have whitespace characters');
        return false;
    }
    if (!/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(body.email.trim())) {
        logger.error('Email address is illegal');
        return false;
    }
    if (body.content.trim() === '') {
        logger.error('Content is empty or only have whitespace characters');
        return false;
    }
    if (body.content.trim().replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '_').length > 1000) {
        logger.error('Content\'s length is more than 1000 characters');
        return false;
    }
    if (typeof body.parent !== 'number') {
        logger.error('Parent value is not number');
        return false;
    }
    if (typeof body.receiveEmail !== 'boolean') {
        logger.error('ReceiveEmail value is not boolean');
        return false;
    }
    return true;
};

module.exports = checkSubmit;

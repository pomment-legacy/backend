const wipeInvalid = (obj: { [key: string]: any; }) => {
    const keys = Object.keys(obj);
    keys.forEach((e) => {
        if (obj[e] === undefined || obj[e] === null) {
            delete obj[e];
        }
    });
    return obj;
};

export default wipeInvalid;

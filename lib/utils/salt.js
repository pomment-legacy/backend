const generateSalt = (length) => {
    const data = [];
    for (let i = 0; i < length; i += 1) {
        data.push(Math.floor(Math.random() * 94) + 33);
    }
    return Buffer.from(data).toString('utf8');
};

module.exports = generateSalt;

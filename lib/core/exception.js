class PommentException {
    constructor(message, original = null) {
        this.message = message;
        this.original = original;
    }
}

module.exports = PommentException;

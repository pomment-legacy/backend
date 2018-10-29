module.exports = {
    "extends": "airbnb-base",
    "rules": {
        "no-underscore-dangle": ["error", {
            "allowAfterThis": true,
        }],
        "indent": ["error", 4, {
            "SwitchCase": 1
        }],
        "prefer-destructuring": "off"
    },
    "env": {
        "node": true
    },
    "globals": {
        "$POC": true,       // config
        "$POD": true,       // data instance
        "$POM": true        // general info
    }
};

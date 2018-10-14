module.exports = {
    "extends": "airbnb-base",
    "rules": {
        "no-underscore-dangle": ["error", {
            "allowAfterThis": true,
        }],
        "indent": ["error", 4, {
            "SwitchCase": 1
        }]
    },
    "env": {
        "node": true
    },
    "globals": {
        "$POM": true
    }
};

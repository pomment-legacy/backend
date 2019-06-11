const escapeHTML = require('./notify/escape');

function getUnsubPage(article) {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, maximum-scale=1, initial-scale=1">
    <head>Unsubscribe Confirmation</head>
    <style>
        .main {
            margin: 0 auto;
            max-width: 48em;
            background-color: #fff;
            padding: 1em;
            box-sizing: border-box;
            border-radius: 1em;
        }
        body {
            background-color: #eee;
            margin: 1em;
        }
        h1 {
            text-align: center;
            margin: 0 0 0.4em 0;
        }
        p {
            margin: 1.2em 0;
        }
        form {
            margin: 0;
            text-align: center;
        }
        input[type="submit"] {
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
            border: 0;
            font-size: 1em;
            background-color: #ddd;
            padding: 0.7em 2em;
            border-radius: 0.4em;
        }
        a {
            color: #b71313;
            text-decoration: none;
        }
        a:hover {
            color: #fd4343;
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="main">
        <h1>Unsubscribe Confirmation</h1>
        <p>You will unsubscribe notification of a comment you made <a href="${escapeHTML(article)}">here</a>.</p>
        <form action=""><input type="submit" value="Unsubscribe"></form>
    </div>
</body>
</html>`;
}

module.exports = getUnsubPage;

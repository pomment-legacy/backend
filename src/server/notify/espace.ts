const needEscape = /["'&<>\r\n\x20\xA0]/;

const escapeHTML = (str: any, linebreak = false) => {
    const targetStr = String(str);
    if (!needEscape.exec(targetStr)) {
        return targetStr;
    }
    let newStr = '';
    for (let i = 0; i < targetStr.length; i += 1) {
        switch (targetStr.charCodeAt(i)) {
        case 32:
        case 160:
            newStr += '&nbsp;';
            break;
        case 34: // "
            newStr += '&quot;';
            break;
        case 38: // &
            newStr += '&amp;';
            break;
        case 39: // '
            newStr += '&#39;';
            break;
        case 60: // <
            newStr += '&lt;';
            break;
        case 62: // >
            newStr += '&gt;';
            break;
        case 10:
            newStr += linebreak ? '<br>' : '&nbsp;';
            break;
        case 13:
            newStr += linebreak ? '<br>' : '&nbsp;';
            if (targetStr.charCodeAt(i + 1) === 10) {
                i += 1;
            }
            break;
        default:
            newStr += targetStr[i];
        }
    }
    return newStr;
};

export default escapeHTML;

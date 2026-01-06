const {nanoid} = require('nanoid');

function generateShortCode(length = 6) {
    return nanoid(length);
}

module.exports = generateShortCode;
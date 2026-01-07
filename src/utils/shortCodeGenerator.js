const {nanoid} = require('nanoid');

//generates a unique shortCode of length 6
function generateShortCode(length = 6) {
    return nanoid(length);
}

//returns the shortCode
module.exports = generateShortCode;
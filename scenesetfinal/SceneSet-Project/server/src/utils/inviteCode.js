const crypto = require('node:crypto');
const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function createInviteCode() {
  const bytes = crypto.randomBytes(12);
  let code = '';
  for (const byte of bytes) code += alphabet[byte % alphabet.length];
  return code;
}

module.exports = { createInviteCode };

const { promisify } = require('node:util');
const { randomBytes, scrypt: callback, timingSafeEqual } = require('node:crypto');
const scrypt = promisify(callback);
// Preserve the original format and cost for existing accounts.
const options = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, 64, options);
  return `scrypt$${salt}$${key.toString('hex')}`;
}
async function verifyPassword(password, hash) {
  const valid = typeof hash === 'string' && /^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(hash);
  const [, salt, expected] = valid ? hash.split('$') : ['scrypt', '0'.repeat(32), '0'.repeat(128)];
  const actual = await scrypt(password, salt, 64, options);
  return timingSafeEqual(actual, Buffer.from(expected, 'hex')) && valid;
}
module.exports = { hashPassword, verifyPassword };

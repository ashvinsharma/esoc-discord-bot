const requireDir = require('require-dir');

/**
 * This file is used for including all the commands used by users.
 * The real operation may be written in ./../data folder
 * @type {map}
 */
module.exports = requireDir('./', {
  filter: fullPath => fullPath.endsWith('.js'),
});

const requireDir = require('require-dir');

// noinspection JSUnusedGlobalSymbols
/**
 * This file is used for including all the commands used by users.
 * The real operation may be written in ./../data folder
 * @type {map}
 */
module.exports = requireDir('./', {
  filter: fullPath => fullPath.endsWith('.js'),
  mapKey: (val, name) => name.toLowerCase(),
});

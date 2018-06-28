const requireDir = require('require-dir');

module.exports = requireDir('./', {
  filter: fullPath => fullPath.endsWith('.js'),
});

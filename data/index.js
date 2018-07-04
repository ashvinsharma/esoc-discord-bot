const path = require('path');
const Utils = require('../utils');

/**
 * - If you manipulate the object, don't forget to write the new file
 * - We only have to read the file once - on app startup
 */

const mutedUsers = Utils.readJson(path.join(__dirname, './mutedUsers.json'), {});

module.exports = {
  mutedUsers,
};

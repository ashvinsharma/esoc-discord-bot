const path = require('path');
const Utils = require('../utils');
const { mutedUsers } = require('../data');

async function unmute(user, guild) {
  const mutedRole = guild.roles.find('name', 'Muted');
  user.removeRole(mutedRole).catch(error => console.error(`Failed to remove muted role from user. Error: ${error}`));
  delete mutedUsers[user.id];
  Utils.writeJson(mutedUsers, path.join(__dirname, '../data/mutedUsers.json'));
}

module.exports = unmute;

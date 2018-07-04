const addMinutes = require('date-fns/add_minutes');
const path = require('path');
const Utils = require('../utils');
const { mutedUsers } = require('../data');

async function mute(user, guild, minutes, reason) {
  const mutedRole = guild.roles.find('name', 'Muted');
  await user.addRole(mutedRole).catch(error => console.error(`Failed to add muted role to user, Error: ${error}`));

  mutedUsers[user.id] = {
    unmuteAt: Date.parse(addMinutes(Date.now(), minutes)),
    reason,
    guildId: guild.id,
  };

  Utils.writeJson(mutedUsers, path.join(__dirname, '../data/mutedUsers.json'));
}

module.exports = mute;

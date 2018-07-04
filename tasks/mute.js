const addMinutes = require('date-fns/add_minutes');
const path = require('path');
const Utils = require('../utils');
const { mutedUsers } = require('../data');

async function mute(userToMute, moderator, guild, minutes, reason) {
  const mutedRole = guild.roles.find('name', 'Muted');
  await userToMute.addRole(mutedRole).catch(error => console.error(`Failed to add muted role to user, Error: ${error}`));

  mutedUsers[userToMute.id] = {
    unmuteAt: Date.parse(addMinutes(Date.now(), minutes)),
    reason,
    guildId: guild.id,
  };

  userToMute.send(`You have been muted for ${minutes} minutes. Reason: ${reason}`);
  Utils.writeJson(mutedUsers, path.join(__dirname, '../data/mutedUsers.json'));
}

module.exports = mute;

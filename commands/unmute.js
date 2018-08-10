const Discord = require('discord.js');
const { unmute } = require('../tasks');
const { mentionToUserId } = require('./utils');
const { logError } = require('./../logger');

function validate(message, user) {
  const muteRole = message.guild.roles.find('name', 'Muted').id;
  if (!user.roles.has(muteRole)) {
    message.author.send('This user is already unmuted!');
    return false;
  }
  if (!message.member.hasPermission('KICK_MEMBERS')) {
    message.author.send('Sorry you do not have permission to unmute users');
    return false;
  }

  if (!message.mentions || message.mentions.members.size < 1) {
    message.author.send('You have to mention someone with @username to unmute them');
    return false;
  }
  return true;
}

module.exports = {
  name: 'unmute',
  description: '"!unmute [@username]" will unmute "username"',
  execute: async (message, args) => {
    const userToUnmute = message.guild.members.get(mentionToUserId(args[0]));
    const moderator = message.author;

    if (!validate(message, userToUnmute)) {
      return;
    }
    try {
      await unmute(userToUnmute, message.guild);
    } catch (e) {
      logError(e);
    }

    const embedReply = new Discord.RichEmbed({
      title: 'UNMUTED',
      description: `<@${userToUnmute.id}>`,
      fields: [
        {
          name: 'Moderator',
          value: `<@${moderator.id}>`,
          inline: true,
        },
      ],
    });

    const modLogChannel = message.guild.channels.find('name', 'mod_log');
    if (modLogChannel) {
      modLogChannel.send(embedReply);
    } else {
      message.author.send(embedReply);
    }
  },
};

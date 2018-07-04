const Discord = require('discord.js');
const { mute, unmute } = require('../tasks');

function mentionToUserId(mention) {
  return mention.replace(/[<@!>]/g, '');
}

function validate(message, userToMute, minutesMuted, reason) {
  if (!userToMute) {
    message.author.send('You have to mention a user right after "!mute"');
    return false;
  }

  if (!Number.isInteger(minutesMuted)) {
    message.author.send('You need to specify number of minutes to mute someone');
    return false;
  }

  if (!message.member.hasPermission('KICK_MEMBERS')) {
    message.author.send('Sorry you do not have permission to mute users');
    return false;
  }

  if (!message.mentions || message.mentions.members.size < 1) {
    message.author.send('You have to mention someone with @username to mute them');
    return false;
  }

  if (message.mentions.members.size > 1) {
    message.author.send('Please only mention one user in this command "!mute [@username] [reason]');
    return false;
  }

  if (!reason) {
    message.author.send('You have to give a reason to mute someone');
    return false;
  }

  return true;
}

module.exports = {
  name: 'mute',
  description: '"!mute [@username] [minutes] [reason]" will mute "username" for [minutes] minutes',
  execute: async (message, args) => {
    const userToMute = message.guild.members.get(mentionToUserId(args[0]));
    const minutesMuted = parseInt(args[1], 10);
    const reason = args.slice(2).join(' ');
    const moderator = message.author;

    if (!validate(message, userToMute, minutesMuted, reason)) {
      return;
    }

    await mute(userToMute, moderator, message.guild, minutesMuted, reason);

    setTimeout(async () => {
      await unmute(userToMute, message.guild);
    }, minutesMuted * 1000 * 60);

    const embedReply = new Discord.RichEmbed({
      title: 'MUTED',
      description: `<@${userToMute.id}>`,
      fields: [
        {
          name: 'Minutes muted',
          value: minutesMuted,
          inline: true,
        },
        {
          name: 'Moderator',
          value: `<@${moderator.id}>`,
          inline: true,
        },
        {
          name: 'Reason',
          value: reason,
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

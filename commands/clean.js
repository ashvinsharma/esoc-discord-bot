const { DARK_ORANGE } = require('./../constants');

function validate(message, args) {
  if (args.length !== 1) {
    const string = (args.length > 1) ? 'Just 1 argument is required!' : 'This command requires 1 argument';
    message.channel.send(`${string}\nTry: !clean [number]`);
    return false;
  }

  const messagesNumber = parseInt(args[0], 10);
  if (!Number.isInteger(messagesNumber) || messagesNumber === 0) {
    message.channel.send('Argument should be a positive integer(max 99).');
    return false;
  }

  if (!message.member.hasPermission('MANAGE_MESSAGES')) {
    message.channel.send(`Seems like you can't use this command! ${message.client.emojis.find('name', ':cry:')}`);
    return false;
  }
  return true;
}

module.exports = {
  name: 'clean',
  description: 'Cleans the [number] of messages from the given channel',
  usage: '[number: 1 - 99]`',
  execute: async (message, args) => {
    if (!validate(message, args)) return;
    const deletedMessages = Array.from(await message.channel.bulkDelete(parseInt(args[0], 10) + 1, true), ([k, v]) => v);
    const messageWord = (parseInt(args[0], 10) === 1) ? 'message was' : 'messages were';
    message.channel.send(`${args[0]} ${messageWord} deleted from here!`);
    const modLogChannel = message.guild.channels.find('name', 'mod_log');
    let messages = '';
    deletedMessages.shift();
    deletedMessages.reverse();
    deletedMessages.map((dm) => {
      messages = messages.concat(`${dm.author}: ${dm.content}\n`);
    });
    if (modLogChannel) {
      const author = message.author;
      const embed = {
        description: `**${args[0]} ${messageWord} deleted by ${author} in ${message.channel}**\n`
        + `${messages}`,
        color: DARK_ORANGE,
        timestamp: new Date().toISOString(),
        footer: {
          text: `ID: ${author.id}`,
        },
        author: {
          name: `${author.username}#${author.discriminator}`,
          icon_url: author.avatarURL,
        },
        fields: [],
      };
      modLogChannel.send({ embed });
    }
  },
};

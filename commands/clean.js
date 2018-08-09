function validate(message, args) {
  if (args.length !== 1) {
    const string = (args.length > 1) ? 'Just 1 argument is required!' : 'This command requires 1 argument';
    message.channel.send(`${string}\nTry: !clean [number]`);
    return false;
  }

  if (!Number.isInteger(parseInt(args[0], 10))) {
    message.channel.send('Argument should be a positive integer(max 100).');
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
  usage: '[number]',
  execute: async (message, args) => {
    if (!validate(message, args)) return;
    const deletedMessages = Array.from(await message.channel.bulkDelete(parseInt(args[0], 10) + 1, true), ([k, v]) => v);
    message.channel.send(`${args[0]} messages were deleted from here!`);
    const modLogChannel = message.guild.channels.find('name', 'mod_log');
    let messages = '';
    deletedMessages.map((dm) => {
      messages = messages.concat(`${dm.author}: ${dm.content}\n`);
    });
    if (modLogChannel) {
      const author = message.author;
      const embed = {
        description: `**${args[0]} Messages were deleted by ${author} in ${message.channel}**\n`
        + `${messages}`,
        // TODO: change the color
        color: 11468156,
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

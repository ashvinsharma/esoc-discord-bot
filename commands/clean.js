const { DARK_ORANGE } = require('./../constants');
const Utils = require('./../utils');
const { prefix } = require('./../config');

const name = 'clean';

function validate(message, args) {
  if (args.length !== 1) {
    const string = (args.length > 1) ? 'Just 1 argument is required!' : 'This command requires 1 argument';
    message.channel.send(`${string}\nTry: ${prefix}help ${name}`);
    return [false];
  }

  if (!Utils.isOnlyDigits(args[0])) {
    message.channel.send('Argument should be a positive integer(max 99).');
    return [false];
  }

  // Removing leading zeroes if any
  let messagesNumber = args[0];
  while (messagesNumber.startsWith('0')) {
    messagesNumber = messagesNumber.slice(1);
  }

  messagesNumber = Number(messagesNumber);
  if (!Number.isInteger(messagesNumber) || messagesNumber === 0 || messagesNumber > 99) {
    message.channel.send('Argument should be a positive integer(max 99).');
    return [false];
  }

  if (!message.member.hasPermission('MANAGE_MESSAGES')) {
    message.channel.send('Seems like you can\'t use this command! 😢');
    return [false];
  }
  return [true, messagesNumber];
}

module.exports = {
  name,
  description: 'Cleans the [number] of messages from the given channel',
  usage: '[number: 1 - 99]',

  execute: async (message, args) => {
    const resultValidate = validate(message, args);
    if (!resultValidate[0]) return;
    // eslint-disable-next-line
    const deletedMessages = Array.from(await message.channel.bulkDelete(parseInt(args[0], 10) + 1, true), ([k, v]) => v);
    const messageWord = (resultValidate[1] === 1) ? 'message was' : 'messages were';
    // message.channel.send(`${resultValidate[1]} ${messageWord} deleted from here!`);
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
        description: `**${resultValidate[1]} ${messageWord} deleted by ${author} in ${message.channel}**\n`
        + `${messages}`,
        color: DARK_ORANGE,
        timestamp: new Date().toISOString(),
        footer: {
          text: `ID: ${author.id}`,
        },
        author: {
          name: `${author.username}#${author.discriminator}`,
          icon_url: author.displayAvatarURL,
        },
        fields: [],
      };
      modLogChannel.send({ embed });
    }
  },
};

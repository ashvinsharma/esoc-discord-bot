const path = require('path');
require('dotenv')
  .config({ path: path.join(__dirname, '.env') });
const Discord = require('discord.js');
const Utils = require('./utils');
const { prefix } = require('./config');
const commands = require('./commands');
const { mutedUsers } = require('./data');
const { log, logError } = require('./logger');
const { BLUE, DARK_ORANGE } = require('./constants');
// const generalChannel = process.env.DISCORD_CHANNEL_ID_GENERAL;
const client = new Discord.Client();
let avatar = {};

client.on('ready', async () => {
  log('Discord bot started');
  client.user.setActivity('Type !help for a list of the commands.')
    .catch(logError);
  avatar = await Utils.fetchAvatarsFromDb();
  Utils.startGettingGames(client);
  Utils.startGettingStreams(client);
  avatar = await Utils.fetchAvatarsFromDb()
    .catch(logError);
  await Utils.ensureMutedRolesExists(client.guilds)
    .catch(logError);
  await Utils.unmuteUsers(client.guilds, mutedUsers)
    .catch(logError);
});

client.on('guildMemberAdd', (member) => {
  log(`Event: "guildMemberAdd". New member ${member} joined`);
  // temporarily disable this (too many messages)
  // const channel = client.channels.get(generalChannel);
  // channel.send(Utils.getMessage(member));
});

client.on('message', (message) => {
  if (!message.content.startsWith(prefix)) return;
  if (message.author.bot) return;
  const args = message.content.slice(prefix.length)
    .split(/ +/);
  const command = commands[args[0].toLowerCase()];
  if (!command) {
    logError(`Could not find command "${args[0].toLowerCase()}" to execute...`);
    return;
  }
  if (!(message.channel.name === 'bot-commands' || message.channel.type === 'dm') && !(command.name === 'clean' || command.name === 'mute')) {
    log('Commands can\'t be sent in that channel');
    return;
  }
  try {
    log(`Execute command "${message.content}"`);
    if (message.content.split(' ')[0].slice(1)
      .toLowerCase() === 'player') {
      args.push(avatar);
    }
    command.execute(message, args.slice(1));
  } catch (error) {
    logError(`Command "${args[0].toLowerCase()}" failed to execute. Original message: "${message.content}". Error: ${error}`);
    message.reply('Oops, something went wrong');
  }
});

// Deleting this feature on the suggestion of 91 and Edeholland
// client.on('messageDelete', async (message) => {
//   const modLogChannel = message.guild.channels.find('name', 'mod_log');
//   const author = message.author;
//   if (message.channel.name === 'live-streams' || message.channel.name === 'eso-ep-activity') return;
//   const auditEntry = await message.guild.fetchAuditLogs({ type: 'MESSAGE_DELETE' })
//     .then(audit => audit.entries.first());
//   let executor;
//   if (auditEntry.extra.channel.id === message.channel.id
//     && auditEntry.target.id === message.author.id
//     && auditEntry.createdTimestamp > (Date.now() - 5000)) {
//     executor = auditEntry.executor;
//   } else {
//     executor = message.author;
//   }
//   if (modLogChannel) {
//     const embed = {
//       description: `**Message sent by ${author} deleted in ${message.channel}**\n`
//       + `${message.content}`,
//       color: DARK_ORANGE,
//       timestamp: new Date().toISOString(),
//       footer: {
//         text: `Executor ID: ${executor.id}`,
//       },
//       author: {
//         name: `${executor.username}#${executor.discriminator}`,
//         icon_url: executor.displayAvatarURL,
//       },
//       fields: [],
//     };
//     modLogChannel.send({ embed });
//   }
// });

// Deleting this feature on the suggestion of dev team members and Edeholland
// client.on('messageUpdate', (oldM, newM) => {
//   if (oldM.channel.name === 'live-streams'
//     || oldM.channel.name === 'eso-ep-activity'
//     // || newM.content === ''
//     || oldM.content === newM.content) {
//     return;
//   }
//   const modLogChannel = oldM.guild.channels.find('name', 'mod_log');
//   const author = oldM.author;
//   const embed = {
//     description: `**Message edited in ${oldM.channel}**`,
//     color: BLUE,
//     timestamp: new Date().toISOString(),
//     footer: {
//       text: `ID: ${author.id}`,
//     },
//     author: {
//       name: `${author.username}#${author.discriminator}`,
//       icon_url: author.displayAvatarURL,
//     },
//     fields: [
//       {
//         name: 'Before',
//         value: oldM.content,
//       },
//       {
//         name: 'After',
//         value: newM.content,
//       },
//     ],
//   };
//   modLogChannel.send({ embed })
//     .catch(logError);
// });

client.login(process.env.DISCORD_TOKEN)
  .then(() => log('Bot logged in successfully'))
  .catch((error) => {
    if (!process.eventNames.DISCORD_TOKEN) {
      return logError(`Failed to login. Are you sure you set the "DISCORD_TOKEN" environment variable? Error: ${error}`);
    }

    return logError(`Failed to login. Error: ${error}`);
  });

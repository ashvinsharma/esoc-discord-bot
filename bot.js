require('dotenv').config();
const Discord = require('discord.js');
const Utils = require('./utils');
const { prefix } = require('./config');
const commands = require('./commands');
const { mutedUsers } = require('./data');

const generalChannel = process.env.DISCORD_CHANNEL_ID_GENERAL;
const client = new Discord.Client();

client.on('ready', async () => {
  Utils.startGettingGames(client);
  Utils.startGettingStreams(client);
  await Utils.ensureMutedRolesExists(client.guilds).catch(console.error);
  await Utils.unmuteUsers(client.guilds, mutedUsers).catch(console.error);
  // client.channels.get(generalChannel).bulkDelete(33);
});

client.on('guildMemberAdd', (member) => {
  const channel = client.channels.get(generalChannel);
  channel.send(Utils.getMessage(member));
});

client.on('message', (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).split(/ +/);
  const command = commands[args[0].toLowerCase()];

  if (!command) return;

  try {
    command.execute(message, args.slice(1));
  } catch (e) {
    console.error(`${new Date()}: Failed to execute command "${command}". message: "${message.content}". Error: ${e}`);
    message.reply('Oops, something went wrong');
  }
});

client.login(process.env.DISCORD_TOKEN)
  .then(() => console.debug(`${new Date()} `, 'logged in!'))
  .catch(console.error);

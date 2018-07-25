require('dotenv').config();
const Discord = require('discord.js');
const Utils = require('./utils');
const { prefix } = require('./config');
const commands = require('./commands');
const { mutedUsers } = require('./data');
const { log, logError } = require('./logger');

// const generalChannel = process.env.DISCORD_CHANNEL_ID_GENERAL;
const client = new Discord.Client();

client.on('ready', async () => {
  log('Discord bot started');
  Utils.startGettingGames(client);
  Utils.startGettingStreams(client);
  await Utils.ensureMutedRolesExists(client.guilds).catch(logError);
  await Utils.unmuteUsers(client.guilds, mutedUsers).catch(logError);
});

client.on('guildMemberAdd', (member) => {
  log(`Event: "guildMemberAdd". New member ${member} joined`);
  // temporarily disable this (too many messages)
  // const channel = client.channels.get(generalChannel);
  // channel.send(Utils.getMessage(member));
});

client.on('message', (message) => {
  if (!message.content.startsWith(prefix)) {
    return;
  }

  if (message.author.bot) {
    return;
  }

  const args = message.content.slice(prefix.length).split(/ +/);
  const command = commands[args[0].toLowerCase()];

  if (!command) {
    log(`Could not find command "${args[0].toLowerCase()}" to execute...`);
    return;
  }

  try {
    log(`Execute command "${message.content}"`);
    command.execute(message, args.slice(1));
  } catch (error) {
    logError(`Command "${args[0].toLowerCase()}" failed to execute. Original message: "${message.content}". Error: ${error}`);
    message.reply('Oops, something went wrong');
  }
});

client.login(process.env.DISCORD_TOKEN)
  .then(() => log('Bot logged in successfully'))
  .catch((error) => {
    if (!process.eventNames.DISCORD_TOKEN) {
      return logError(`Failed to login. Are you sure you set the "DISCORD_TOKEN" environment variable? Error: ${error}`);
    }

    return logError(`Failed to login. Error: ${error}`);
  });

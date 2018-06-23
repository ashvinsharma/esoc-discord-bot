const Discord = require('discord.js');
const Utils = require('./utils');
const { token, general_channel_id: generalChannel } = require('./config');

const client = new Discord.Client();

client.on('ready', async () => {
  // console.log(client.channels)
  Utils.startGettingGames(client);
  Utils.startGettingStreams(client);
});

client.on('guildMemberAdd', (member) => {
  const channel = client.channels.get(generalChannel);
  channel.send(Utils.getMessage(member));
});

client.login(token)
  .then(() => {
    console.debug(`${new Date()} `, 'logged in!');
  });

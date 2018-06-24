const Discord = require('discord.js');
const net = require('net');
const Utils = require('./utils');
const { prefix_query: query, token, general_channel_id: generalChannel } = require('./config');

const client = new Discord.Client();

client.on('ready', async () => {
  Utils.startGettingGames(client);
  Utils.startGettingStreams(client);
  // client.channels.get(generalChannel).bulkDelete(33);
});

client.on('guildMemberAdd', (member) => {
  const channel = client.channels.get(generalChannel);
  channel.send(Utils.getMessage(member));
});

async function check(message) {
  const socket = new net.Socket();
  socket.setTimeout(1000);
  socket.connect(2300, '168.61.152.225', () => {
    message.channel.send('ESO is up and runnin');
  });
  socket.end();
  socket.on('timeout', () => {
    message.channel.send('Down I guess');
  });
}

client.on('message', (message) => {
  if (message.content === `${query}eso`) {
    check(message);
  }
});

client.login(token)
  .then(() => {
    console.debug(`${new Date()} `, 'logged in!');
  });

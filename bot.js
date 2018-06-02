const Discord = require('discord.js');
const client = new Discord.Client();
const eso_server = require('./eso_server.js');
const Twitch = require('./twitch.js');

client.login('MzQ5ODU1NzcyNTM4MTc1NDg5.DeyxAg.09EkuUIcf1SdLAQB8anNujAvxLk').catch(function(error){
    console.log(error);
});

client.on('ready', () => {
    console.log(`Loggeds in as ${client.user.tag}!`);
    Twitch.Streams();
});


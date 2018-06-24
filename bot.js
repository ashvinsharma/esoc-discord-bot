const Discord = require('discord.js');
const Utils = require('./utils');
const fs = require('fs');
const {prefix, token, general_channel_id: generalChannel} = require('./config');

const client = new Discord.Client();
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

client.on('ready', async () => {
    Utils.startGettingGames(client).catch(e => console.log(e.message));
    Utils.startGettingStreams(client);
    // client.channels.get(generalChannel).bulkDelete(33);
});

client.on('guildMemberAdd', (member) => {
    const channel = client.channels.get(generalChannel);
    channel.send(Utils.getMessage(member));
});

client.on('message', (message) => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).split(/ +/);
    const command = args[0].toLowerCase();

    if(!client.commands.has(command)) return;

    try{
        client.commands.get(command).execute(message,args)
    }
    catch (e) {
        console.log(e);
        message.reply('error');
    }

});

client.login(token)
    .then(() => {
        console.debug(`${new Date()} `, 'logged in!');
    });

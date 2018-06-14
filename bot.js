const Discord = require('discord.js');
const {prefix, token} = require('./config');
const sleep = require('await-sleep');
const client = new Discord.Client();
const eso_server = require('./eso_server.js');
const Twitch = require('./twitch.js');

const twitchUrl = "https://www.twitch.tv/";

const liveChannelID = '452605197584171012';

client.on('ready', () => {

    const channel = client.channels.get(liveChannelID);
    channel.bulkDelete(100, false);
    
    startGettingStreams(client).then(() => {
        console.log('Everything\'s working');
    }).catch(err => console.error('Error: ' + err));
});

client.login(token).then(() => {
    console.log('logged in!');
});

async function startGettingStreams(client) {
    while (1) {
        const response = await Twitch.getStream();
        const channel = client.channels.get(liveChannelID);
        let streams;

        //channel.bulkDelete(100, false);

        streams = response.streams;

        for (let stream of streams) {
            let user = response.users['user_' + stream.user_id];

            //   console.log(JSON.stringify(response.users['user_' + stream.user_id]));

            const embed = {
                'title': `https://www.twitch.tv/${user.login}`,
                'url': 'https://discordapp.com',
                'timestamp': `${stream.started_at}`,
                'image': {
                    'url': `${(stream.thumbnail_url).replace("{height}", "768").replace("{width}", "1366")}`
                },
                'author': {
                    'name': `${user.display_name} is streaming `,
                    'url': 'https://discordapp.com',
                    'icon_url': `${stream.thumbnail_url}`
                },
                'fields': [
                    {
                        'name': `Title`,
                        'value': `${stream.title}`,
                        'inline': true
                    },
                    {
                        'name': 'Viewers',
                        'value': `${stream.viewer_count}`,
                        'inline': true
                    }
                ]
            };
            //channel.send('```json\n' + JSON.stringify(key) + '```');

            let chose = await channel.fetchMessages({limit: 100}).then(messages => {

                let testString = `${user.display_name} is streaming`;
                let edited = false;
                for (let m of messages) {

                    console.log(m[1].embeds[0]);

                    if (m[1].embeds[0].author.name.toString() === testString) {
                        m[1].edit("", {embed: embed});
                        edited = true;
                        break;
                    }
                }
                if (edited === false) {
                    channel.send({embed})
                }
            }).catch(e => console.log(e.message));
        }

        // let schedule = Twitch._getUser(data.userID);
        // console.log(JSON.stringify(schedule));
        console.log('one iteration');
        await sleep(30000);

    }
}







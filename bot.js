const Discord = require('discord.js');
const {token, twitch_channel_id: liveChannel} = require('./config');
const sleep = require('await-sleep');
const client = new Discord.Client();
const Twitch = require('./twitch.js');
const twitchUrl = 'https://www.twitch.tv/';
const updateInterval = 30000; // ms and not seconds.
const GRAY = 0x4f545c;
const GOLD = 0xffa500;

client.on('ready', () => {
    const channel = client.channels.get(liveChannel);
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
        const channel = client.channels.get(liveChannel);
        let streams;
        streams = response.streams;
        for (let stream of streams) {
            let user = response.users['user_' + stream.user_id];
            const url = `${twitchUrl}${user.login}`;
            const embedColor = (stream.viewer_count >= 13) ? GOLD : GRAY;
            const embed = {
                'title': `${url}`,
                'color': `${embedColor}`,
                'url': `${url}`,
                'timestamp': `${stream.started_at}`,
                'image': {
                    'url': `${(stream.thumbnail_url).replace('{height}', '768').replace('{width}', '1366')}`
                },
                'author': {
                    'name': `${user.display_name} is streaming `,
                    'url': `${url}`,
                    'icon_url': `https://images-ext-1.discordapp.net/external/IZEY6CIxPwbBTk-S6KG6WSMxyY5bUEM-annntXfyqbw/https/cdn.discordapp.com/emojis/287637883022737418.png`
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
            await channel.fetchMessages({limit: 100}).then(messages => {
                let testString = `${user.display_name} is streaming`;
                let edited = false;
                for (let m of messages) {
                    if (m[1].embeds[0].author.name.toString() === testString) {
                        m[1].edit('', {embed});
                        edited = true;
                        break;
                    }
                }
                if (edited === false) {
                    channel.send({embed});
                }
            }).catch(e => console.error(e.message));
        }
        await sleep(updateInterval);
    }
}







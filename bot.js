const Discord = require('discord.js');
const {token, twitch_channel_id: liveChannel} = require('./config');
const sleep = require('await-sleep');
const client = new Discord.Client();
const Twitch = require('./twitch.js');
const twitchUrl = 'https://www.twitch.tv/';
const updateInterval = 60000; // ms and not seconds.
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
    let streamsEmbed = new Map();

    while (1) {
        let tempStreamMap = new Map();
        const response = await Twitch.getStream();

        const channel = client.channels.get(liveChannel);

        let streams;
        let user;

        streams = response.streams;

        for (let stream of streams) {
            user = response.users['user_' + stream.user_id];

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

            if (streamsEmbed.get(user.display_name) === undefined) {
                let foo = await channel.send({embed: embed}).then(m => {
                    console.log(`${user.display_name} stream added`);
                    tempStreamMap.set(user.display_name, m.id);
                }).catch(e => console.log(e.message));
            }
            else {
                let foo = await channel.fetchMessage(streamsEmbed.get(user.display_name))
                    .then(m => {
                        tempStreamMap.set(user.display_name, m.id);
                        m.edit("", {embed})
                            .catch(e => console.log(e.message));
                        console.log(`${user.display_name} stream updated`);
                    })
                    .catch(e => console.log(e.message));
            }

            /* await channel.fetchMessages({limit: 100}).then(messages => {

                 let testString = `${user.display_name} is streaming`;
                 let edited = false;
                 for (let m of messages) {
                     if (m[1].embeds[0].author.name.toString() === testString) {
                         m[1].edit('', {embed}).catch(e => console.log(e.message));
                         edited = true;
                         break;
                     }
                 }
                 if (edited === false) {
                 }
             }).catch(e => console.error(e.message));*/
        }
        for (let streamEmbed of streamsEmbed) {
            if (streamEmbed !== undefined && tempStreamMap.get(streamEmbed[0]) === undefined) {
                let foo = await channel.fetchMessage(streamEmbed[1]).then(m => {
                    m.delete().catch(e => console.log(e.message));
                    console.log(`${streamEmbed[0]} stream deleted`);
                })
                    .catch(e => console.log(e.message));
            }
        }
        streamsEmbed = tempStreamMap;
        await sleep(updateInterval);
    }
}







const Discord = require('discord.js')
const {token, twitch_channel_id: liveChannel} = require('./config')
const sleep = require('await-sleep')
const client = new Discord.Client()
const Twitch = require('./twitch.js')
const twitchUrl = 'https://www.twitch.tv/'
const updateInterval = 60000 // ms and not seconds.
const GRAY = 0x4f545c
const GOLD = 0xffa500

client.on('ready', () => {
    startGettingStreams(client).then(() => {
        console.log('Everything\'s working')
    }).catch(err => console.error('Error: ' + err))
})

client.login(token).then(() => {
    console.log('logged in!')
})

/**
 *  Gets data from Twitch helix API and posts in the channel.
 *  All the streams are stored in map ({streamer_name: message_id}).
 *  Uses map to create/update/delete embed messages in the channel.
 *
 * @param client
 * @return Prints streams on the live-channel
 */
async function startGettingStreams(client) {
    let streamsEmbed = new Map()
    const channel = client.channels.get(liveChannel)
    channel.bulkDelete(100, false)
    while (true) {
        let tempStreamMap = new Map()
        const response = await Twitch.getStream()
        const channel = client.channels.get(liveChannel)
        let user
        const streams = response.streams
        for (let stream of streams) {
            user = response.users['user_' + stream.user_id]
            const url = `${twitchUrl}${user.login}`
            const embedColor = (stream.viewer_count >= 13) ? GOLD : GRAY
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
            }
            // Adds the stream if not in the map
            if (streamsEmbed.get(user.display_name) === undefined) {
                await channel.send({embed: embed}).then(m => {
                    console.log(`${user.display_name} stream added`)
                    tempStreamMap.set(user.display_name, m.id)
                }).catch(e => console.log(e.message))
            } else {
                // Update the streams if changed
                await channel.fetchMessage(streamsEmbed.get(user.display_name)).then(m => {
                    tempStreamMap.set(user.display_name, m.id)
                    m.edit('', {embed}).catch(e => console.log(e.message))
                    console.log(`${user.display_name} stream updated`)
                }).catch(e => console.log(e.message))
            }
        }
        // Deletes the streams if not found in the response
        for (let streamEmbed of streamsEmbed) {
            if (streamEmbed !== undefined && tempStreamMap.get(streamEmbed[0]) === undefined) {
                await channel.fetchMessage(streamEmbed[1]).then(m => {
                    m.delete().catch(e => console.log(e.message))
                    console.log(`${streamEmbed[0]} stream deleted`)
                }).catch(e => console.log(e.message))
            }
        }
        streamsEmbed = tempStreamMap
        await sleep(updateInterval)
    }
}

const Discord = require('discord.js')
const eso = require('./eso')
const {token, twitch_channel_id: liveChannel} = require('./config')
const {ep_channel_id: epChannel} = require('./config')
const sleep = require('await-sleep')
const client = new Discord.Client()
const Twitch = require('./twitch')
const twitchUrl = 'https://www.twitch.tv/'
const updateInterval = 60000 // ms and not seconds.
const GRAY = 0x4f545c
const GOLD = 0xffa500
const GOLD_COUNT = 25

client.on('ready', async () => {
    startGettingGames(client)
    startGettingStreams(client)
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
    let streamEmbeds = new Map()
    const channel = client.channels.get(liveChannel)
    channel.bulkDelete(100, false)
    while (true) {
        let tempStreamMap = new Map()
        const response = await Twitch.getStream()
        let user
        const streams = response.streams
        for (let stream of streams) {
            user = response.users['user_' + stream.user_id]
            const url = `${twitchUrl}${user.login}`
            const embedColor = (stream.viewer_count >= GOLD_COUNT) ? GOLD : GRAY
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
            if (streamEmbeds.get(user.display_name) === undefined) {
                channel.send({embed}).then(m => {
                    console.log(`${user.display_name} stream added`)
                    tempStreamMap.set(user.display_name, m.id)
                }).catch(e => console.log(e))
            } else {
                // Update the streams if changed
                channel.fetchMessage(streamEmbeds.get(user.display_name)).then(m => {
                    tempStreamMap.set(user.display_name, m.id)
                    m.edit('', {embed}).catch(e => console.log(e))
                    console.log(`${user.display_name} stream updated`)
                }).catch(e => console.error(e))
            }
        }
        // Deletes the streams if not found in the response
        for (let streamEmbed of streamEmbeds) {
            if (streamEmbed !== undefined && tempStreamMap.get(streamEmbed[0]) === undefined) {
                channel.fetchMessage(streamEmbed[1]).then(m => {
                    m.delete().catch(e => console.error(e))
                    console.log(`${streamEmbed[0]} stream deleted`)
                }).catch(e => console.error(e))
            }
        }
        streamEmbeds = tempStreamMap
        await sleep(updateInterval)
    }
}

async function startGettingGames(client) {
    let gameEmbeds = new Map()
    const channel = client.channels.get(epChannel)
    channel.bulkDelete(100, false)
    while (true) {
        let newGames = new Map()
        const games = await eso.getLobby()
        for (let game of games) {
            let count = 0
            for (let p of game.players) if (p === null) count++
            const date = new Date()
            const embed = {
                'title': game.name,
                'url': eso.getUserLink(game.players[0], game.patch),
                'color': eso.getEmbedColor(game.patch),
                'timestamp': date.toISOString(game.last_pong),
                'footer': {
                    'icon_url': 'https://cdn.discordapp.com/embed/avatars/0.png',
                    'text': 'Created At'
                },
                'thumbnail': {
                    'url': eso.getPatchIcon(game.patch)
                },
                'image': {
                    'url': ''
                },
                'author': {
                    'name': eso.getPatch(game.patch),
                    'icon_url': eso.getPatchIcon(game.patch)
                },
                'fields': [
                    {
                        'name': 'Host',
                        'value': `${game.players[0]}`,
                        'inline': true
                    },
                    {
                        'name': 'Players',
                        'value': `${8 - count}/${game.max_players}`,
                        'inline': true
                    },
                    {
                        'name': 'Map',
                        'value': `${game.map}`,
                        'inline': true
                    },
                    {
                        'name': 'Game mode',
                        'value': 'Treaty 10 min.',
                        'inline': true
                    }
                ]
            }
            if (gameEmbeds.get(game.id) === undefined) {
                channel.send({embed}).then(message => {
                    console.log(`${game.name} is created`)
                    newGames.set(game.id, message.id)
                }).catch(e => console.error("hi " + e))
            } else {
                channel.fetchMessage(gameEmbeds.get(game.id)).then(message => {
                    newGames.set(game.id, message.id)
                    message.edit('', {embed}).catch(e => console.erroror(e))
                    console.log(`${game.name} is updated`)
                }).catch(e => console.error(e))
            }
        }
        for (let gameEmbed of gameEmbeds) {
            if (gameEmbed !== undefined && newGames.get(gameEmbed[0]) === undefined) {
                channel.fetchMessage(streamEmbed[1]).then(message => {
                    message.delete().catch(e => console.error(e))
                    console.log(`Game ID: ${gameEmbed[0]} deleted`)
                }).catch(e => console.error(e))
            }
        }
        gameEmbeds = newGames
        await sleep(updateInterval)
    }
}
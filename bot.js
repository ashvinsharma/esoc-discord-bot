const Discord = require('discord.js');
const sleep = require('await-sleep');

const client = new Discord.Client();
const { token, twitch_channel_id: liveChannel } = require('./config');
const { ep_channel_id: epChannel } = require('./config');
const eso = require('./eso');
const Twitch = require('./twitch');

const twitchUrl = 'https://www.twitch.tv/';
const updateInterval = 60000; // ms and not seconds.
const GRAY = 0x4f545c;
const GOLD = 0xffa500;
const GOLD_COUNT = 25;

async function deleteRedundantMessages(deleteJobs) {
  if (deleteJobs.length >= 1) {
    await Promise.all(deleteJobs);
  }
}

/**
 *  Gets data from Twitch helix API and posts in the channel.
 *  All the streams are stored in map ({streamer_name: message_id}).
 *  Uses map to create/update/delete embed messages in the channel.
 *
 * @param client
 * @return Prints streams on the live-channel
 */
async function startGettingStreams(client) {
  let streamEmbeds = new Map();
  const channel = client.channels.get(liveChannel);
  channel.bulkDelete(100, false);
  // noinspection InfiniteLoopJS
  while (true) {
    const tempStreamMap = new Map();
    const response = await Twitch.getStream();
    let user;
    const streams = response.streams;
    streams.map(async (stream) => {
      user = response.users[`user_${stream.user_id}`];
      const url = `${twitchUrl}${user.login}`;
      const embedColor = (stream.viewer_count >= GOLD_COUNT) ? GOLD : GRAY;
      const embed = {
        title: `${url}`,
        color: `${embedColor}`,
        url: `${url}`,
        timestamp: `${stream.started_at}`,
        image: {
          url: `${(stream.thumbnail_url).replace('{height}', '768')
            .replace('{width}', '1366')}`,
        },
        author: {
          name: `${user.display_name} is streaming `,
          url: `${url}`,
          icon_url: 'https://images-ext-1.discordapp.net/external/IZEY6CIxPwbBTk-S6KG6WSMxyY5bUEM-annntXfyqbw/https/cdn.discordapp.com/emojis/287637883022737418.png',
        },
        fields: [
          {
            name: 'Status',
            value: `${stream.title}`,
            inline: true,
          },
          {
            name: 'Viewers',
            value: `${stream.viewer_count}`,
            inline: true,
          },
        ],
      };
      // Update the streams if changed
      if (streamEmbeds.get(user.display_name) !== undefined) {
        const m = await channel.fetchMessage(streamEmbeds.get(user.display_name));
        tempStreamMap.set(user.display_name, m.id);
        m.edit('', { embed });
        console.debug(`${new Date()} `, `${user.display_name} stream updated`);
      }
      // Adds the stream if not in the map
      if (streamEmbeds.get(user.display_name) === undefined) {
        const m = await channel.send({ embed });
        console.debug(`${new Date()} `, `${user.display_name} stream added`);
        tempStreamMap.set(user.display_name, m.id);
      }
    });
    // Deletes the streams if not found in the response
    const deleteStreams = [];
    streamEmbeds.forEach((val, key, map) => {
      if (map !== undefined && tempStreamMap.get(key) === undefined) {
        channel.fetchMessage(val)
          .then((message) => {
            deleteStreams.push(message.delete());
          });
      }
    });
    deleteRedundantMessages(deleteStreams);
    streamEmbeds = tempStreamMap;
    await sleep(updateInterval);
  }
}

async function startGettingGames(client) {
  let gameEmbeds = new Map();
  const channel = client.channels.get(epChannel);
  channel.bulkDelete(100, false);
  // noinspection InfiniteLoopJS
  while (true) {
    const newGames = new Map();
    const games = await eso.getLobbies();
    await Promise.all(games.map(async (game) => {
      const embed = await eso.createEmbed(game);
      // Update
      if ((gameEmbeds.get(game.id) !== undefined)) {
        const message = await channel.fetchMessage(gameEmbeds.get(game.id));
        newGames.set(game.id, message.id);
        message.edit('', { embed });
        console.debug(`${new Date()} `, `${game.name} is updated`);
      }
      // Add
      if (gameEmbeds.get(game.id) === undefined) {
        const message = await channel.send({ embed });
        console.debug(`${new Date()} `, `${game.name} is created`);
        newGames.set(game.id, message.id);
      }
    }))
      .catch(e => console.error(`${new Date()} `, e));
    // Remove
    const deleteGames = [];
    gameEmbeds.forEach(async (val, key, map) => {
      if (map !== undefined && newGames.get(key) === undefined) {
        const message = await channel.fetchMessage(val);
        deleteGames.push(message.delete());
      }
    });
    deleteRedundantMessages(deleteGames);
    gameEmbeds = newGames;
    // await sleep(updateInterval);
  }
}

client.on('ready', async () => {
  startGettingGames(client);
  // startGettingStreams(client);
});

client.login(token)
  .then(() => {
    console.debug(`${new Date()} `, 'logged in!');
  });

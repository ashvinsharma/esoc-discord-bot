const sleep = require('await-sleep');
const con = require('./db');
const {
  twitch_channel_id: liveChannel,
} = require('./config');
const { ep_channel_id: epChannel } = require('./config');
const ESO = require('./esoActivity');
const Twitch = require('./twitch');

const updateInterval = 60000; // ms and not seconds.

let lastRandom = null;

class Utils {
  static async deleteRedundantMessages(deleteJobs) {
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
  static async startGettingStreams(client) {
    let streamEmbeds = new Map();
    const channel = client.channels.get(liveChannel);
    channel.bulkDelete(100, false);
    // noinspection InfiniteLoopJS
    while (true) {
      const tempStreamMap = new Map();
      const response = await Twitch.getStream();
      const streams = response.streams;
      await Promise.all(streams.map(async (stream) => {
        const user = await response.users[`user_${stream.user_id}`];
        const embed = await Twitch.createEmbed(response, stream, user);
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
      }))
        .catch(e => console.error(`${new Date()} `, e));
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
      this.deleteRedundantMessages(deleteStreams).catch(e => console.log(e.message));
      streamEmbeds = tempStreamMap;
      await sleep(updateInterval);
    }
  }

  static async startGettingGames(client) {
    let maps = [
      {
        DisplayName: 'unknown',
        MiniMapUrl: '/images/aoe3/maps/unknown.png',
      },
      {
        DisplayName: 'large maps',
        MiniMapUrl: '/images/aoe3/maps/large_maps.png',
      },
      {
        DisplayName: 'asian maps',
        MiniMapUrl: '/images/aoe3/maps/asian_maps.png',
      },
      {
        DisplayName: 'all maps',
        MiniMapUrl: '/images/aoe3/maps/all_maps.png',
      },
      {
        DisplayName: 'team maps',
        MiniMapUrl: '/images/aoe3/maps/team_maps.jpg',
      },
      {
        DisplayName: 'knb maps',
        MiniMapUrl: '/images/aoe3/maps/kb_maps.png',
      },
      {
        DisplayName: 'esoc maps',
        MiniMapUrl: '/images/aoe3/maps/esoc_maps.jpg',
      },
      {
        DisplayName: 'classic maps',
        MiniMapUrl: '/images/aoe3/maps/classic_maps.png',
      },
      {
        DisplayName: 'standard maps',
        MiniMapUrl: '/images/aoe3/maps/standard_maps.png',
      },
    ];
    maps = await Utils.addMaps(maps);
    let gameEmbeds = new Map();
    const channel = client.channels.get(epChannel);
    channel.bulkDelete(100, false);
    // noinspection InfiniteLoopJS
    while (true) {
      const newGames = new Map();
      const games = await ESO.getLobbies();
      await Promise.all(games.map(async (game) => {
        const embed = await ESO.createEmbed(game, maps);
        // Update
        if ((gameEmbeds.get(game.id) !== undefined)) {
          const message = await channel.fetchMessage(gameEmbeds.get(game.id));
          newGames.set(game.id, message.id);
          message.edit('', { embed }).catch(e => console.log(e.message));
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
      this.deleteRedundantMessages(deleteGames).catch(e => e.message);
      gameEmbeds = newGames;
      await sleep(updateInterval);
    }
  }

  static random(max) {
    let random;
    if (lastRandom === undefined) {
      random = Math.floor(Math.random() * max);
    } else {
      random = Math.floor(Math.random() * max);
      if (random >= lastRandom) random += 1;
    }
    lastRandom = random % max;
    return lastRandom;
  }

  static getMessage(member) {
    const templates = [
      `Wololo! ${member} has been converted to ESOC`,
      `A new villager has been trained. Welcome ${member}!`,
      `${member} found a new treasure and joins the ESOC Discord.`,
      `${member} I said hi!`,
      `${member} joined, #modthe${member}!`,
      `${member}, did you know quick search games are always rated?`,
    ];
    const idx = this.random(templates.length);
    return templates[idx];
  }

  static async addMaps(maps) {
    const getMap = 'SELECT esoc.maps.ID, esoc.maps.DisplayName, esoc.maps.MiniMapUrl, '
      + 'phpBB.p_users.username, esoc.maps.TPs, esoc.maps.Natives, esoc.maps.Outlaws, '
      + 'esoc.maps.Date, esoc.maps.GameType FROM esoc.maps LEFT JOIN phpBB.p_users ON '
      + 'esoc.maps.Author = phpBB.p_users.user_id';
    const [rows, fields] = await con.execute(getMap);
    return [...maps, ...rows];
  }
}

module.exports = Utils;

/* eslint-disable */
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
      await Promise.all(deleteJobs).catch(e => console.error(`${new Date()} ${e}`));
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
      this.deleteRedundantMessages(deleteStreams);
      streamEmbeds = tempStreamMap;
      await sleep(updateInterval);
    }
  }

  static async startGettingGames(client) {
    const maps = await Utils.addMaps();
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
          message.edit('', { embed }).catch(e => console.error(`${new Date()} ${e}`));
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
      this.deleteRedundantMessages(deleteGames);
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

  static async addMaps() {
    let maps = [
      {
        map_name: 'unknown',
        DisplayName: 'unknown',
        MiniMapUrl: '/images/aoe3/maps/unknown.png',
      },
      {
        map_name: 'large maps',
        DisplayName: 'large maps',
        MiniMapUrl: '/images/aoe3/maps/large_maps.png',
      },
      {
        map_name: 'asian maps',
        DisplayName: 'asian maps',
        MiniMapUrl: '/images/aoe3/maps/asian_maps.png',
      },
      {
        map_name: 'all maps',
        DisplayName: 'all maps',
        MiniMapUrl: '/images/aoe3/maps/all_maps.png',
      },
      {
        map_name: 'team maps',
        DisplayName: 'team maps',
        MiniMapUrl: '/images/aoe3/maps/team_maps.jpg',
      },
      {
        map_name: 'knb maps',
        DisplayName: 'knb maps',
        MiniMapUrl: '/images/aoe3/maps/kb_maps.png',
      },
      {
        map_name: 'esoc maps',
        DisplayName: 'esoc maps',
        MiniMapUrl: '/images/aoe3/maps/esoc_maps.jpg',
      },
      {
        map_name: 'classic maps',
        DisplayName: 'classic maps',
        MiniMapUrl: '/images/aoe3/maps/classic_maps.png',
      },
      {
        map_name: 'standard maps',
        DisplayName: 'standard maps',
        MiniMapUrl: '/images/aoe3/maps/standard_maps.png',
      },
    ];
    const getMap = 'SELECT a.map_id, a.map_name, m.*, p.username FROM esoc.maps_aliases a '
      + 'INNER JOIN esoc.maps m ON m.ID = a.map_id '
      + 'LEFT JOIN phpBB.p_users p ON p.user_id = m.Author';
    const [rows, fields] = await con.execute(getMap);
    maps = [...maps, ...rows];
    maps = maps.map((map) => {
      // eslint-disable-next-line camelcase
      const { map_name, ...others } = map;
      return { mapName: map_name, ...others };
    });
    maps = maps.reduce((obj, item) => {
      obj[item.mapName.toLowerCase()] = item; // eslint-disable-line no-param-reassign
      return obj;
    }, {});
    return maps;
  }
}

module.exports = Utils;

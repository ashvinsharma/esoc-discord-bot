/* eslint-disable */
const sleep = require('await-sleep');
const con = require('./db');
const { twitch_channel_id: liveChannel } = require('./config');
const { ep_channel_id: epChannel } = require('./config');
const ESO = require('./esoActivity');
const Twitch = require('./twitch');
const constants = require('./constants');
const fs = require('fs');
const updateIntervalTwitch = 60000; // ms and not seconds.
const updateIntervalESOC = 15000;

let lastRandom = null;

class Utils {
  static async deleteRedundantMessages(deleteJobs) {
    if (deleteJobs.length >= 1) {
      await Promise.all(deleteJobs)
        .catch(e => console.error(`${new Date()}: ${__filename}\n ${e}`));
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
        .catch(e => console.error(`${new Date()}: ${__filename}\n ${e}`));
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
      await sleep(updateIntervalTwitch);
    }
  }

  static getUnknownMaps() {
    try {
      return new Set(JSON.parse(fs.readFileSync('maps_name.json', 'utf8')));
    } catch (err) {
      return new Set();
    }
  }

  static async startGettingGames(client) {
    const maps = await Utils.getMaps();
    let unknownMaps = Utils.getUnknownMaps();
    let gameEmbeds = new Map();
    const channel = client.channels.get(epChannel);
    channel.bulkDelete(100, false);
    // noinspection InfiniteLoopJS
    while (true) {
      const newGames = new Map();
      const games = await ESO.getLobbies();
      await Promise.all(games.map(async (game) => {
        const embed = await ESO.createEmbed(game, maps, unknownMaps);
        // Update
        if ((gameEmbeds.get(game.id) !== undefined)) {
          const message = await channel.fetchMessage(gameEmbeds.get(game.id));
          newGames.set(game.id, message.id);
          message.edit('', { embed })
            .catch(e => console.error(`${new Date()}: ${__filename}\n ${e}`));
          console.debug(`${new Date()} `, `${game.name} is updated`);
        }
        // Add
        if (gameEmbeds.get(game.id) === undefined) {
          const message = await channel.send({ embed });
          console.debug(`${new Date()} `, `${game.name} is created`);
          newGames.set(game.id, message.id);
        }
      }))
        .catch(e => console.error(`${new Date()}: ${__filename}\n ${e}`));
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
      await sleep(updateIntervalESOC);
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

  static async fetchMapsFromDb() {
    let maps = [];

    try {
      [maps] = await con.execute(constants.MAPS_QUERY);
    } catch (error) {
      console.error('Failed to fetch maps from database: ', error);
    }

    // Turn map_name into mapName
    return maps.map(({ map_name, ...others }) => ({ mapName: map_name, ...others }));
  }

  static async getMaps() {
    const maps = {};
    const mapArray = [...constants.MAPS, ...await Utils.fetchMapsFromDb()];

    // Turn array into object, mapname as keys
    mapArray.forEach(map => {
      maps[map.mapName] = map;
    });

    return maps;
  }
}

module.exports = Utils;

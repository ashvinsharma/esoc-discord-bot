/* eslint-disable */
const sleep = require('await-sleep');
const fs = require('fs');
const path = require('path');
const con = require('./db');
const ESO = require('./esoActivity');
const Twitch = require('./twitch');
const Discord = require('discord.js');
const constants = require('./constants');
const { log, logError } = require('./logger');
const liveChannel = process.env.DISCORD_CHANNEL_ID_TWITCH;
const epChannel = process.env.DISCORD_CHANNEL_ID_EP;
let lastRandom = null;

class Utils {
  static async deleteRedundantMessages(deleteJobs) {
    log('Delete redundant messages');
    if (deleteJobs.length >= 1) {
      await Promise.all(deleteJobs)
        .catch(error => console.error(`Failed to delete redundant messages. Error: ${error}`));
    }
  }

  static arrayToObject(array, keyField) {
    return array.reduce((obj, item) => {
      obj[item[keyField]] = item;
      return obj;
    }, {});
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
    log('Start Getting Streams...');
    let streamEmbeds = new Map();
    const channel = client.channels.get(liveChannel);
    log('Delete 100 last messages in stream channel...');
    channel.bulkDelete(100, true)
      .then(() => log('Delete successful'))
      .catch(error => logError(`Failed to delete messages. Error: ${error}`));
    // noinspection InfiniteLoopJS
    while (true) {
      const tempStreamMap = new Map();
      log('Twitch get/refresh streams..');
      try {
        const response = await Twitch.getStream();
        log('Found streams');
        const streams = response.streams;
        await Promise.all(streams.map(async (stream) => {
          const user = await response.users[`user_${stream.user_id}`];
          log('Create embed..');
          const embed = await Twitch.createEmbed(response, stream, user);
          log('Created embed successfully');
          // Update the streams if changed
          if (streamEmbeds.get(user.display_name) !== undefined) {
            log(`Stream "${user.display_name}" updated. Edit discord message..`);
            const m = await channel.fetchMessage(streamEmbeds.get(user.display_name));
            tempStreamMap.set(user.display_name, m.id);
            m.edit('', { embed });
            log(`"${user.display_name}" stream updated successfully`);
          }
          // Adds the stream if not in the map
          if (streamEmbeds.get(user.display_name) === undefined) {
            log(`Adding stream "${user.display_name}" to channel..`);
            const m = await channel.send({ embed });
            log(`"${user.display_name}" stream added successfully`);
            tempStreamMap.set(user.display_name, m.id);
          }
        }))
          .catch(error => logError(`Failed to update the streams messages. Error: ${error}`));
        // Deletes the streams if not found in the response
        const deleteStreams = [];
        streamEmbeds.forEach((val, key, map) => {
          if (map !== undefined && tempStreamMap.get(key) === undefined) {
            log(`Delete streams from discord that are not in the response from Twitch`);
            channel.fetchMessage(val)
              .then((message) => {
                deleteStreams.push(message.delete());
              })
              .catch(error => logError('Failed to fetch message to be deleted'));
          }
        });
        this.deleteRedundantMessages(deleteStreams);
        streamEmbeds = tempStreamMap;
      } catch (e) {
        logError(e);
      }
      log(`${constants.UPDATE_TWITCH_INTERVAL / 1000} seconds until next stream update...`);
      try {
        await sleep(constants.UPDATE_TWITCH_INTERVAL);
      } catch (e) {
        logError(`Sleep Error: ${e}`);
      }
    }
  }

  static getUnknownMaps() {
    log('Getting unknown maps from maps_name.json');
    try {
      const mapSet = new Set(JSON.parse(fs.readFileSync('maps_name.json', 'utf8')));
      log('Found unknown maps set successfully');
      return mapSet;
    } catch (err) {
      log('Could not find maps_name.json, using empty set..');
      return new Set();
    }
  }

  static async startGettingGames(client) {
    log('Start getting games...');
    const maps = await Utils.getMaps()
      .catch(logError);
    let unknownMaps = Utils.getUnknownMaps();
    let gameEmbeds = new Map();
    const channel = client.channels.get(epChannel);
    channel.bulkDelete(100, false);
    // noinspection InfiniteLoopJS
    while (true) {
      log('Get/refresh ESOC games...');
      const newGames = new Map();
      try {
        const games = await ESO.getLobbies();
        await Promise.all(games.map(async (game) => {
          log(`Creating embed for game "${game.name}"`);
          const embed = await ESO.createEmbed(game, maps, unknownMaps);
          log('Successfully created an embed for ESOC game');
          // Update
          if ((gameEmbeds.get(game.id) !== undefined)) {
            log(`Update discord message for game ${game.id}`);
            const message = await channel.fetchMessage(gameEmbeds.get(game.id))
              .catch(error => logError(`Failed to fetch message with game id ${game.id}. Error: ${error}`));
            newGames.set(game.id, message.id);
            message.edit('', { embed })
              .catch(error => logError(`Failed to edit message with game id ${game.id}. Error: ${error}`));
            log(`Game "${game.name}" was updated`);
          }
          // Add
          if (gameEmbeds.get(game.id) === undefined) {
            log(`Add discord message for new game with id ${game.id}`);
            const message = await channel.send({ embed })
              .catch(error => logError(`Failed to send message embed for game "${game.id}". error: ${error}`));
            log(`Game "${game.name}" was created`);
            newGames.set(game.id, message.id);
          }
        }))
          .catch(error => logError(`Failed in Promise.all trying to create discord message embeds for all games. Error: ${error}`));
        // Remove
        const deleteGames = [];
        log('Remove old messages with games that are no longer hosted');
        gameEmbeds.forEach(async (val, key, map) => {
          if (map !== undefined && newGames.get(key) === undefined) {
            const message = await channel.fetchMessage(val)
              .catch(error => logError(`Failed to fetch message with value ${val}. Error: ${error}`));
            deleteGames.push(message.delete());
          }
        });
        this.deleteRedundantMessages(deleteGames);
        gameEmbeds = newGames;
      } catch (e) {
        logError(e);
      }
      log(`Wait for ${constants.UPDATE_INTERVAL_ESOC / 1000} seconds before updating game list again...`);
      try {
        await sleep(constants.UPDATE_INTERVAL_ESOC);
      } catch (e) {
        logError(`Sleep Error: ${e}`);
      }
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

  // noinspection JSUnusedGlobalSymbols
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

  static async fetchAvatarsFromDb() {
    let avatar = [];
    try {
      log('Fetching avatars from database...');
      [avatar] = await con.execute(constants.AVATAR_QUERY);
      log('Successfully fetched avatars from database');
    } catch (error) {
      logError(`Failed to fetch avatars from database. ${error}`);
    }
    avatar = avatar.map(({ image_name, ...others }) => ({
      ...others,
      imageName: image_name
    }));
    return this.arrayToObject(avatar, 'hash');
  }

  static async fetchMapsFromDb() {
    let maps = [];
    try {
      log('Fetching maps from database...');
      [maps] = await con.execute(constants.MAPS_QUERY);
      log('Successfully fetched maps from database');
    } catch (error) {
      logError(`Failed to fetch maps from database. ${error}`);
    }

    // Turn map_name into mapName
    return maps.map(({ map_name, ...others }) => ({ mapName: map_name, ...others }));
  }

  static async getMaps() {
    const maps = {};
    try {
      let mapArray = [...constants.MAPS, ...await Utils.fetchMapsFromDb()];
      // Turn array into object, mapname as keys
      mapArray.forEach(map => {
        maps[map.mapName] = map;
      });
    } catch (e) {
      logError(e);
    }
    return maps;
  }

  static async ensureMutedRolePermissions(guild) {
    log('Ensure that muted role permissions are correctly set...');
    const mutedRole = guild.roles.find('name', 'Muted');

    if (!mutedRole) {
      return logError(`No mutedRole exists in ${guild.name}, and failed to create one.`);
    }

    try {
      return await Promise.all(Array.from(guild.channels, async ([channelId, channel]) => {
        return await channel.overwritePermissions(mutedRole, {
          SEND_MESSAGES: false,
          ADD_REACTIONS: false,
        });
      }));
    } catch (error) {
      return logError(`Failed to set channel permissions of mutedRole in ${guild.name}. Error: ${error}`);
    }
  }

  static async createMutedRole(guild) {
    log(`Create muted role in ${guild.name}`);
    await guild.createRole({
      name: 'Muted',
      color: constants.RED,
      permissions: [],
    })
      .catch(error => console.error(`Failed to create mutedRole in ${guild.name}. Error: ${error}`));

    await Utils.ensureMutedRolePermissions(guild);
  }

  static async ensureMutedRolesExists(guilds) {
    await Promise.all(Array.from(guilds, async ([guildId, guild]) => {
      const mutedRole = guild.roles.find('name', 'Muted');
      if (!mutedRole) {
        await Utils.createMutedRole(guild);
      }
    }))
      .catch(console.error);
  }

  static async unmuteUsers(guilds, mutedUsers) {
    log('Make sure all users that should be unmuted have been unmuted...');
    await Promise.all(Object.entries(mutedUsers)
      .map(async ([userId, user]) => {
        if (Date.now() > user.unmuteAt) {
          const guild = guilds.get(user.guildId);
          const mutedRole = guild.roles.find('name', 'Muted');
          await guild.members.get(userId)
            .removeRole(mutedRole)
            .catch(error => logError(`Failed to remove muted role from user. Error: ${error}`));
          delete mutedUsers[userId];
        }
      }))
      .catch(error => logError(`Failed to unmute users. Error: ${error}`));
    log('Save users to mutedUsers.json...');
    Utils.writeJson(mutedUsers, path.join(__dirname, './data/mutedUsers.json'));
  }

  static writeJson(json, filePath) {
    // filePath: Absolute path to file, including filename
    try {
      fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
    } catch (error) {
      logError(`Failed to write json. Error: ${error}`);
    }
  }

  static readJson(filePath, fallback) {
    // filePath: Absolute path to file, including filename
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      if (fallback !== undefined) {
        return fallback;
      }

      throw new Error(`Failed to parse/read json file, error: ${error}`);
    }
  }

  static getCommands() {
    let commands = new Discord.Collection();
    const commandObject = require('./commands/');

    Object.entries(commandObject)
      .forEach(
        ([key, value]) =>
          commands.set(key, value)
      );

    return commands;

  }

  static isOnlyDigits(input) {
    const onlyDigitsRegexp = new RegExp(/^[0-9]+$/);
    return onlyDigitsRegexp.test(input);
  }
}

module.exports = Utils;

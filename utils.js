const sleep = require('await-sleep');
const con = require('./db');
const {
  twitch_channel_id: liveChannel,
} = require('./config');
const { ep_channel_id: epChannel } = require('./config');
const ESO = require('./eso');
const Twitch = require('./twitch');

const updateInterval = 60000; // ms and not seconds.

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
      this.deleteRedundantMessages(deleteStreams);
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
      this.deleteRedundantMessages(deleteGames);
      gameEmbeds = newGames;
      await sleep(updateInterval);
    }
  }

  static random(max) {
    let lastRandom;
    let random;
    if (lastRandom === undefined) {
      random = Math.floor(Math.random() * max);
    } else {
      random = Math.floor(Math.random() * max);
      if (random >= lastRandom) random += 1;
    }
    lastRandom = random;
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

  // static convertArr2Obj() {
  //   const maps = [
  //     {
  //       ID: 1,
  //       DisplayName: 'ESOC Manchac',
  //       MiniMapUrl: '/images/aoe3/maps/manchac.png',
  //       Author: 'Rikikipu',
  //       TPs: '3',
  //       Natives: 'Seminoles',
  //       Outlaws: 'Renegado / Pistolero',
  //       Date: 'Feb 2016',
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 2,
  //       DisplayName: 'ESOC Adirondacks',
  //       MiniMapUrl: '/images/aoe3/maps/adirondacks.png',
  //       Author: 'Garja',
  //       TPs: '3',
  //       Natives: 'Huron',
  //       Outlaws: 'Renegado / Comanchero',
  //       Date: 'Mar 2016',
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 3,
  //       DisplayName: 'ESOC Arizona',
  //       MiniMapUrl: '/images/aoe3/maps/arizona.png',
  //       Author: 'Garja',
  //       TPs: '4',
  //       Natives: 'Apache / Navajo',
  //       Outlaws: 'Renegado / Comanchero',
  //       Date: 'Feb 2015',
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 4,
  //       DisplayName: 'ESOC Arkansas',
  //       MiniMapUrl: '/images/aoe3/maps/arkansas.png',
  //       Author: 'Garja',
  //       TPs: '3',
  //       Natives: 'Cherokee',
  //       Outlaws: 'Renegado / Pirate',
  //       Date: 'Feb 2015',
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 5,
  //       DisplayName: 'ESOC Bonnie Springs',
  //       MiniMapUrl: '/images/aoe3/maps/bonnie_springs.png',
  //       Author: 'Rikikipu',
  //       TPs: '4',
  //       Natives: null,
  //       Outlaws: 'Renegado / Comanchero',
  //       Date: 'Feb 2016',
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 6,
  //       DisplayName: 'ESOC Baja California',
  //       MiniMapUrl: '/images/aoe3/maps/baja_california.png',
  //       Author: 'Garja',
  //       TPs: '3',
  //       Natives: 'Apache / Navajo',
  //       Outlaws: 'Comanchero / Renegado',
  //       Date: 'Feb 2015',
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 7,
  //       DisplayName: 'ESOC Bengal',
  //       MiniMapUrl: '/images/aoe3/maps/bengal.png',
  //       Author: 'Garja',
  //       TPs: '0',
  //       Natives: 'Bhakti',
  //       Outlaws: 'Dacoit / Thuggee',
  //       Date: 'Feb 2015',
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 8,
  //       DisplayName: 'ESOC Mendocino',
  //       MiniMapUrl: '/images/aoe3/maps/mendocino.png',
  //       Author: 'Rikikipu',
  //       TPs: '4',
  //       Natives: 'Zapotec / Mapuche',
  //       Outlaws: 'Renegado / Pirate',
  //       Date: 'Feb 2016',
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 9,
  //       DisplayName: 'ESOC Pampas Sierras',
  //       MiniMapUrl: '/images/aoe3/maps/pampas_sierras.png',
  //       Author: 'Garja',
  //       TPs: '0',
  //       Natives: 'Inca / Mapuche',
  //       Outlaws: 'Pistolero / Comanchero',
  //       Date: 'Feb 2015',
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 10,
  //       DisplayName: 'ESOC Tassili',
  //       MiniMapUrl: '/images/aoe3/maps/tassili.png',
  //       Author: 'Rikikipu',
  //       TPs: '4',
  //       Natives: null,
  //       Outlaws: 'Pistolero / Comanchero',
  //       Date: 'Feb 2016',
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 11,
  //       DisplayName: 'ESOC Cascade Range',
  //       MiniMapUrl: '/images/aoe3/maps/cascade_range.png',
  //       Author: 'Garja',
  //       TPs: '0',
  //       Natives: 'Klamath / Nootka',
  //       Outlaws: 'Renegado / Pistolero',
  //       Date: 'Feb 2015',
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 12,
  //       DisplayName: 'ESOC Colorado',
  //       MiniMapUrl: '/images/aoe3/maps/colorado.png',
  //       Author: 'Rikikipu',
  //       TPs: '4',
  //       Natives: 'Comanche',
  //       Outlaws: 'Pistolero / Renegado',
  //       Date: 'Feb 2016',
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 13,
  //       DisplayName: 'ESOC Florida',
  //       MiniMapUrl: '/images/aoe3/maps/florida.png',
  //       Author: 'Garja',
  //       TPs: '4',
  //       Natives: 'Seminole / Caribs',
  //       Outlaws: 'Pirate',
  //       Date: 'Jul 2016',
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 14,
  //       DisplayName: 'ESOC High Plains',
  //       MiniMapUrl: '/images/aoe3/maps/high_plains.png',
  //       Author: 'Garja',
  //       TPs: '5',
  //       Natives: 'Comanche / Cheyenne',
  //       Outlaws: 'Renegado / Comanchero',
  //       Date: 'Feb 2015',
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 15,
  //       DisplayName: 'ESOC Hudson Bay',
  //       MiniMapUrl: '/images/aoe3/maps/hudson_bay.png',
  //       Author: 'Garja',
  //       TPs: '3 - 4',
  //       Natives: 'Cree / Huron',
  //       Outlaws: 'Comanchero / Pirate',
  //       Date: 'Feb 2015',
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 16,
  //       DisplayName: 'ESOC Indonesia',
  //       MiniMapUrl: '/images/aoe3/maps/indonesia.png',
  //       Author: 'Garja',
  //       TPs: '0',
  //       Natives: 'Jesuit / Sufi',
  //       Outlaws: 'Wokou Pirate / Dacoit',
  //       Date: 'Feb 2015',
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 17,
  //       DisplayName: 'ESOC Kamchatka',
  //       MiniMapUrl: '/images/aoe3/maps/kamchatka.png',
  //       Author: 'Garja',
  //       TPs: '3',
  //       Natives: null,
  //       Outlaws: 'Wokous Pirate / Horseman',
  //       Date: 'Feb 2015',
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 18,
  //       DisplayName: 'ESOC Klondike',
  //       MiniMapUrl: '/images/aoe3/maps/klondike.png',
  //       Author: 'Garja',
  //       TPs: '5',
  //       Natives: 'Nootka',
  //       Outlaws: 'Pistolero / Comanchero',
  //       Date: 'Feb 2016',
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 19,
  //       DisplayName: 'ESOC Tibet',
  //       MiniMapUrl: '/images/aoe3/maps/tibet.png',
  //       Author: 'Garja',
  //       TPs: '6',
  //       Natives: 'Udasi /  Shaolin',
  //       Outlaws: 'Marathan Dacoit / Wokou Horseman',
  //       Date: 'Feb 2015',
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 20,
  //       DisplayName: 'ESOC Manchuria',
  //       MiniMapUrl: '/images/aoe3/maps/manchuria.png',
  //       Author: 'Garja',
  //       TPs: '3 - 4',
  //       Natives: 'Shaolin / Zen',
  //       Outlaws: 'Wokous',
  //       Date: 'Feb 2015',
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 21,
  //       DisplayName: 'ESOC Gran Chaco',
  //       MiniMapUrl: '/images/aoe3/maps/gran_chaco.png',
  //       Author: 'Garja',
  //       TPs: '0',
  //       Natives: 'Tupi',
  //       Outlaws: 'Pistolero / Pirate',
  //       Date: 'Jan 2017',
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 22,
  //       DisplayName: 'ESOC Herald Island',
  //       MiniMapUrl: '/images/aoe3/maps/herald_island.png',
  //       Author: 'Rikikipu',
  //       TPs: '3',
  //       Natives: null,
  //       Outlaws: 'Pistolero / Comanchero',
  //       Date: 'Jul 2017',
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 23,
  //       DisplayName: 'ESOC Fertile Crescent',
  //       MiniMapUrl: '/images/aoe3/maps/fertile_crescent.png',
  //       Author: 'Garja',
  //       TPs: '4',
  //       Natives: 'Sufi',
  //       Outlaws: 'Dacoit / Thuggee',
  //       Date: 'Jan 2017',
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 24,
  //       DisplayName: 'ESOC Malaysia',
  //       MiniMapUrl: '/images/aoe3/maps/malaysia.png',
  //       Author: 'Rikikipu',
  //       TPs: '2',
  //       Natives: 'Jesuit / Sufi',
  //       Outlaws: 'Wokou Pirate /  Dacoit',
  //       Date: 'Jan 2017',
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 25,
  //       DisplayName: 'ESOC Thar Desert',
  //       MiniMapUrl: '/images/aoe3/maps/thar_desert.png',
  //       Author: 'Rikikipu',
  //       TPs: '0',
  //       Natives: 'Udasi',
  //       Outlaws: 'Wokous',
  //       Date: 'Jul 2016',
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 26,
  //       DisplayName: 'ESOC Jebel Musa',
  //       MiniMapUrl: '/images/aoe3/maps/jebel_musa.png',
  //       Author: 'Durokan',
  //       TPs: '3',
  //       Natives: 'Jesuits / Apache',
  //       Outlaws: 'Dacoit / Thuggee',
  //       Date: 'Jan 2017',
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 28,
  //       DisplayName: 'ESOC Iowa',
  //       MiniMapUrl: '/images/aoe3/maps/iowa.png',
  //       Author: 'Rikikipu',
  //       TPs: '3',
  //       Natives: 'Inca / Lakota',
  //       Outlaws: 'Renegado / Pirate',
  //       Date: 'Mar 2017',
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 30,
  //       DisplayName: 'Amazonia',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 31,
  //       DisplayName: 'Andes',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 32,
  //       DisplayName: 'Araucania',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 33,
  //       DisplayName: 'Cayou',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 34,
  //       DisplayName: 'Corneo',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 35,
  //       DisplayName: 'California',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 36,
  //       DisplayName: 'Caribbean',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 37,
  //       DisplayName: 'Carolina',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 38,
  //       DisplayName: 'Ceylon',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 41,
  //       DisplayName: 'Great lakes',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 42,
  //       DisplayName: 'Great plains',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 43,
  //       DisplayName: 'Himalayas',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 44,
  //       DisplayName: 'HimalayasUpper',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 45,
  //       DisplayName: 'Hispaniola',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 46,
  //       DisplayName: 'Honshu',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 47,
  //       DisplayName: 'HonshuRegicide',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 48,
  //       DisplayName: 'Indochina',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 49,
  //       DisplayName: 'Mongolia',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 50,
  //       DisplayName: 'New England',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 51,
  //       DisplayName: 'Northwest Territory',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 52,
  //       DisplayName: 'Orinoco',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 53,
  //       DisplayName: 'Ozarks',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 54,
  //       DisplayName: 'Painted Desert',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 55,
  //       DisplayName: 'Pampas',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 56,
  //       DisplayName: 'Patagonia',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 57,
  //       DisplayName: 'Plymouth',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 58,
  //       DisplayName: 'Rockies',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 59,
  //       DisplayName: 'Saguenay',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 60,
  //       DisplayName: 'Siberia',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 61,
  //       DisplayName: 'SilkRoad',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 62,
  //       DisplayName: 'Sonora',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 63,
  //       DisplayName: 'Texas',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 64,
  //       DisplayName: 'Unknown',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 65,
  //       DisplayName: 'Yellow riverDry',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 66,
  //       DisplayName: 'Yucatan',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 67,
  //       DisplayName: 'Yukon',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 68,
  //       DisplayName: 'Deccan',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 69,
  //       DisplayName: 'Equal Footing',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoEO',
  //     },
  //     {
  //       ID: 70,
  //       DisplayName: 'Treasure Island',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoEO',
  //     },
  //     {
  //       ID: 71,
  //       DisplayName: 'Coastal',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoEO',
  //     },
  //     {
  //       ID: 72,
  //       DisplayName: 'Sheltered Pass',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoEO',
  //     },
  //     {
  //       ID: 73,
  //       DisplayName: 'Arabia',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoEO',
  //     },
  //     {
  //       ID: 74,
  //       DisplayName: 'ESOC Parallel Rivers',
  //       MiniMapUrl: '/images/aoe3/maps/parallel_rivers.png',
  //       Author: 'Garja',
  //       TPs: '0',
  //       Natives: 'Zen',
  //       Outlaws: 'Wokou Horseman /  Monk',
  //       Date: 'Oct 2017',
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 75,
  //       DisplayName: 'ESOC Wadmalaw',
  //       MiniMapUrl: '/images/aoe3/maps/wadmalaw.png',
  //       Author: 'Rikikipu',
  //       TPs: '3',
  //       Natives: 'Seminoles',
  //       Outlaws: 'Renegado / Pistolero',
  //       Date: 'Oct 2017',
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 76,
  //       DisplayName: 'ESOC Alaska',
  //       MiniMapUrl: '/images/aoe3/maps/alaska.png',
  //       Author: 'Garja',
  //       TPs: '0',
  //       Natives: 'Nootka',
  //       Outlaws: 'Comanchero / Renegado',
  //       Date: 'Oct 2017',
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 77,
  //       DisplayName: 'ESOC Great Basin',
  //       MiniMapUrl: '/images/aoe3/maps/great_basin.png',
  //       Author: 'Garja',
  //       TPs: '4',
  //       Natives: 'Klamath / Navajo',
  //       Outlaws: 'Comanchero / Renegado',
  //       Date: 'Oct 2017',
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 78,
  //       DisplayName: 'Mountain Crossing',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoEO',
  //     },
  //     {
  //       ID: 79,
  //       DisplayName: 'Acre',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 80,
  //       DisplayName: 'Asunción',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 81,
  //       DisplayName: 'Cave',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 82,
  //       DisplayName: 'Congo',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 83,
  //       DisplayName: 'Dallol',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 84,
  //       DisplayName: 'Sahel',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 85,
  //       DisplayName: 'Tuscany',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 86,
  //       DisplayName: 'Watering Hole',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 97,
  //       DisplayName: 'BlitzTreaty Cliff',
  //       MiniMapUrl: 'images/aoe3/maps/blitz_treaty_cliff.png',
  //       Author: 'Gichtenlord',
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 98,
  //       DisplayName: 'BlitzTreaty River',
  //       MiniMapUrl: 'images/aoe3/maps/blitz_treaty_river.png',
  //       Author: 'Gichtenlord',
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 99,
  //       DisplayName: 'BlitzTreaty TradeRoute',
  //       MiniMapUrl: 'images/aoe3/maps/blitz_treaty_cliff.traderoute.png',
  //       Author: 'Gichtenlord',
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 100,
  //       DisplayName: 'ESOC Andes',
  //       MiniMapUrl: 'images/aoe3/maps/andes.png ',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 101,
  //       DisplayName: 'ESOC Deccan 1v1',
  //       MiniMapUrl: 'images/aoe3/maps/deccan_1v1.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 102,
  //       DisplayName: 'ESOC Northern California',
  //       MiniMapUrl: 'images/aoe3/maps/northern_california.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 103,
  //       DisplayName: 'ESOC Orinonco',
  //       MiniMapUrl: 'images/aoe3/maps/orinonco.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 104,
  //       DisplayName: 'ESOC Orinonco Incas',
  //       MiniMapUrl: 'images/aoe3/maps/orinonco_icans.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 105,
  //       DisplayName: 'ESOC Snowy Great Plains',
  //       MiniMapUrl: 'images/aoe3/maps/snowy_great_plains.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 106,
  //       DisplayName: 'BlitzTreaty Andes',
  //       MiniMapUrl: 'images/aoe3/maps/andes.png ',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 107,
  //       DisplayName: 'BlitzTreaty Toluca',
  //       MiniMapUrl: '/images/aoe3/maps/unknown.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 108,
  //       DisplayName: 'BlitzTreaty Snowy Great Plains',
  //       MiniMapUrl: 'images/aoe3/maps/snowy_great_plains.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 109,
  //       DisplayName: 'BlitzTreaty Orinonco',
  //       MiniMapUrl: 'images/aoe3/maps/orinonco.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //     {
  //       ID: 110,
  //       DisplayName: 'BlitzTreaty Northern California',
  //       MiniMapUrl: 'images/aoe3/maps/northern_california.png',
  //       Author: null,
  //       TPs: null,
  //       Natives: null,
  //       Outlaws: null,
  //       Date: null,
  //       GameType: 'AoE3',
  //     },
  //   ];
  //   const arrayToObj = maps => maps.reduce((obj, item) => {
  //     obj[item.DisplayName.toLowerCase()] = item;
  //     return obj;
  //   }, {});
  //   const object = arrayToObj(maps);
  //   console.log(JSON.stringify(object, null, 2));
  // }
}

module.exports = Utils;

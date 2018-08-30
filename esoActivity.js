const request = require('request-promise');
const fs = require('fs');
const Discord = require('discord.js');
const constants = require('./constants');
const { log, logError } = require('./logger');

const { escapeMarkdown } = Discord.Util;

class EsoActivity {
  static async getLobbies() {
    const url = `${constants.ESOC}${constants.ESOC_LOBBIES_URI}`;
    log(`Fetching ESOC patch lobbies from ${url}...`);
    const options = {
      uri: url,
      headers: {
        'User-Agent': 'ESOC-Bot Discord/1.4'
      },
    };
    const req = await request(options)
      .catch(error => logError(`Failed to fetch lobbies from ${url}. Error: ${error}`));
    try {
      log('Parse lobbies..');
      const lobbies = JSON.parse(req);
      log('Successfully fetched and parsed ESOC patch lobbies');
      return lobbies;
    } catch (error) {
      logError(`Found JSON from ${url} but failed to parse it. Invalid JSON. Error: ${error}. \n JSON received: ${req}`);
      return [];
    }
  }

  static getUserLink(player, patch) {
    if (patch === 2) {
      return `${constants.ESOC_SUPREMACY_STANDARD_LADDER}${player}`;
    }
    return `${constants.ESOC_SUPREMACY_TREATY_LADDER}${player}`;
  }

  static getPatch(patch) {
    if (patch === 1) {
      return 'ESOC Patch';
    }
    if (patch === 2) {
      return 'Treaty Patch';
    }
    if (patch === 3) {
      return 'XP Mod';
    }
    return '';
  }

  static isPatch(patch) {
    return [1, 3].some(element => element === patch);
  }

  static getPatchIcon(patch) {
    log('Get patch icon..');
    if (patch === 1) {
      log('Return patch icon for traditional EP');
      return `${constants.ESOC}${constants.ESOC_PATCH_ICON}`;
    }
    if (patch === 2) {
      log('Return patch icon for treaty patch');
      return `${constants.ESOC}${constants.TREATY_PATCH_ICON}`;
    }
    logError(`Could not identify patch from value ${patch}.. Cannot pick a patch icon`);
    return null;
  }

  static getEmbedColor(patch) {
    switch (patch) {
      case 1:
        return constants.ESOC_PATCH_EMBED_COLOR;
      case 2:
        return constants.TREATY_PATCH_EMBED_COLOR;
      case 3:
        return constants.XP_MOD_EMBED_COLOR;
      default:
        return constants.GRAY;
    }
  }

  static getGameMode(game) {
    if (game.game_mode === 0) {
      if (game.treaty_time !== 0) {
        let mode = `Treaty ${game.treaty_time} min.`;
        if (game.no_blockade) mode += ' No blockade';
        return mode;
      }
      if (game.koth) return 'King Of the Hill';
      return 'Supremacy';
    }
    if (game.game_mode === 1) return 'Deathmatch';
    return 'Not-found';
  }

  static getMap(map, patch) {
    log(`Convert map name "${map}" if possible`);
    switch (map) {
      case 'Largerandommaps':
        if (this.isPatch(patch)) return 'Classic Maps';
        return 'Large Maps';
      case 'asianrandom':
        if (this.isPatch(patch)) return 'ESOC Maps';
        return 'Asian Maps';
      case 'featured':
        if (this.isPatch(patch)) return 'KnB Maps';
        break;
      case 'fastrandom':
        return 'Standard Maps';
      case 'randommaps':
        if (this.isPatch(patch)) return 'Team Maps';
        return 'All Maps';
      case null:
        return 'null';
      default:
        return map;
    }
    return null;
  }

  static async getMapIcon(map, scenario, maps, unknownMaps) {
    if (scenario) {
      const mapIcon = `${constants.ESOC}${constants.SCENARIO_IMAGE}`;
      log(`Game is scenario, get scenario image: ${mapIcon}`);
      return mapIcon;
    }
    const mapName = map.trim();
    let mapObject = maps[mapName];
    if (mapObject === undefined) {
      if (!unknownMaps.has(mapName)) {
        log(`map "${mapName}" not found in maps_name.json`);
        try {
          log(`Add "${mapName}" to maps_name.json`);
          unknownMaps.add(mapName);
          fs.writeFile('maps_name.json', JSON.stringify([...unknownMaps], null, 2), (error) => {
            if (error) {
              logError(`Failed to write maps_name.json with new map ${mapName}. Error: ${error}`);
            } else {
              log(`Added "${mapName}" to maps_name.json successfully`);
            }
          });
        } catch (error) {
          logError(`Failed to add ${mapName} to maps_name.json. Error: ${error}`);
        }
      }
      mapObject = maps[mapName.slice(0, 20)];
      if (mapObject === undefined) {
        try {
          log(`Try to find map image for map "${mapName}"...`);
          mapObject = Object.entries(maps)
            .find(map => map[1].mapName.toLowerCase()
              .includes(mapName.toLowerCase()) || mapName.toLowerCase()
              .includes(map[1].mapName.toLowerCase()))[1];
        } catch (error) {
          logError(`Failed to find map image for map "${mapName}". Something had an unexpected format. Error: ${error}`);
          return `${constants.ESOC}${constants.UNKNOWN_MAP_IMAGE}`;
        }
      }
    }
    let url = mapObject.MiniMapUrl;
    if (url[0] !== '/') url = `/${url}`;
    url = `${constants.ESOC}${url}`;
    return url;
  }

  static async createEmbed(game, maps, unknownMaps) {
    let count = 0;
    game.players.map((p) => {
      if (p === null) count += 1;
    });
    let map = this.getMap(game.map, game.patch);
    log(`Map name: ${map}`);
    if (map && map[0] === map[0].toLowerCase()) {
      map = map[0].toUpperCase() + map.slice(1);
      log(`Capitalize map name: "${map}"`);
    }
    const thumbnailUrl = await this.getMapIcon(map, game.scenario, maps, unknownMaps);
    const authorIconUrl = await this.getPatchIcon(game.patch);
    return {
      title: escapeMarkdown(game.name),
      url: game.quicksearch ? '' : this.getUserLink(game.players[0], game.patch),
      color: this.getEmbedColor(game.patch),
      // 'timestamp': date.toISOString(),
      // 'footer': {
      //     'icon_url': '',
      //     'text': `Created At`
      // },
      thumbnail: {
        url: thumbnailUrl,
      },
      image: {
        url: '',
      },
      author: {
        name: this.getPatch(game.patch),
        icon_url: authorIconUrl,
      },
      fields: [
        {
          name: 'Host',
          value: escapeMarkdown(game.players[0]),
          inline: true,
        },
        {
          name: 'Players',
          value: `${8 - count}/${game.max_players}`,
          inline: true,
        },
        {
          name: 'Map',
          value: escapeMarkdown(map),
          inline: true,
        },
        {
          name: 'Game mode',
          value: this.getGameMode(game),
          inline: true,
        },
      ],
    };
  }
}

module.exports = EsoActivity;

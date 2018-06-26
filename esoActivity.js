const request = require('request-promise');

const ESOC = 'http://eso-community.net';

class EsoActivity {
  static async getLobbies() {
    const req = await request(`${ESOC}/assets/patch/api/lobbies.json`);
    try {
      return JSON.parse(req);
    } catch (e) {
      console.error(`${new Date()} ${e}`);
      console.error(req);
      return [];
    }
  }

  static getUserLink(player, patch) {
    if (patch === 2) {
      return `http://eso-community.net/ladder.php?patch=official&type=treaty&mode=overall&player=${player}`;
    }
    return `http://eso-community.net/ladder.php?patch=esoc&type=supremacy&mode=overall&player=${player}`;
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
    return [1, 2, 3].some(element => element === patch);
  }

  static getPatchIcon(patch) {
    if (patch === 1) return `${ESOC}/images/aoe3/patch-esoc-icon.png`;
    if (patch === 2) return `${ESOC}/images/aoe3/patch-treaty-icon.png`;
    return null;
  }

  static getEmbedColor(patch) {
    switch (patch) {
      case 1:
        return 0xc32025;
      case 2:
        return 0x0378c0;
      case 3:
        return 0xc27c0e;
      default:
        return 0x4f545c;
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
      default:
        return map;
    }
    return null;
  }

  static async getMapIcon(map, maps) {
    const mapName = map.trim()
      .toLowerCase();
    let mapObject = maps[mapName];
    if (mapObject === undefined) {
      try {
        mapObject = Object.entries(maps)
          .find(map => map[1].mapName.toLowerCase()
            .includes(mapName) || mapName.includes(map[1].mapName.toLowerCase()))[1];
      } catch (e) {
        console.error(`${new Date()} ${e}`);
        return `${ESOC}/images/aoe3/maps/unknown.png`;
      }
    }
    let url = mapObject.MiniMapUrl;
    if (url[0] !== '/') url = `/${url}`;
    url = `${ESOC}${url}`;
    return url;
  }

  static async createEmbed(game, maps) {
    let count = 0;
    game.players.map((p) => {
      if (p === null) count += 1;
    });
    let map = this.getMap(game.map, game.patch);
    if (map[0] === map[0].toLowerCase()) {
      map = map[0].toUpperCase() + map.slice(1);
    }
    return {
      title: game.name,
      url: this.getUserLink(game.players[0], game.patch),
      color: this.getEmbedColor(game.patch),
      // 'timestamp': date.toISOString(),
      // 'footer': {
      //     'icon_url': '',
      //     'text': `Created At`
      // },
      thumbnail: {
        url: await this.getMapIcon(map, maps),
      },
      image: {
        url: '',
      },
      author: {
        name: this.getPatch(game.patch),
        icon_url: await this.getPatchIcon(game.patch),
      },
      fields: [
        {
          name: 'Host',
          value: `${game.players[0]}`,
          inline: true,
        },
        {
          name: 'Players',
          value: `${8 - count}/${game.max_players}`,
          inline: true,
        },
        {
          name: 'Map',
          value: map,
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

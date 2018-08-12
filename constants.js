const AVATAR_QUERY = 'SELECT hash, image_name FROM esoc.eso_avatar';
const BLUE = 0x117EA6;
const DARK_ORANGE = 0xFF470F;
const DEFAULT_AVATAR = '0c182d86-f9e0-4208-8074-0ce427e40a84';
const GOLD = 0xffA500;
const GOLD_COUNT = 25;
const GRAY = 0x4F545C;
const GREEN = 3842351; // decimal representation of hexa color
const ESO_POP = 'http://agecommunity.com/_server_status_/';
const ESO_QUERY = 'http://www.agecommunity.com/query/query.aspx?g=age3y&name=arg1&md=user';
const ESOC = 'https://eso-community.net';
const ESOC_AVATARS = '/images/avatars/aoe3';
const ESOC_IMAGES = '/images/aoe3';
const ESOC_LOBBIES_URI = '/assets/patch/api/lobbies.json';
const ESOC_SUPREMACY_STANDARD_LADDER = `${ESOC}/ladder.php?patch=official&type=treaty&mode=overall&player=`;
const ESOC_SUPREMACY_TREATY_LADDER = `${ESOC}/ladder.php?patch=esoc&type=supremacy&mode=overall&player=`;
const ESOC_PATCH_ICON = `${ESOC_IMAGES}/patch-esoc-icon.png`;
const ESOC_PATCH_EMBED_COLOR = 0xc32025;
const MAPS = [
  {
    mapName: 'Unknown',
    DisplayName: 'Unknown',
    MiniMapUrl: `${ESOC_IMAGES}/maps/unknown.png`,
  },
  {
    mapName: 'Large Maps',
    DisplayName: 'Large Maps',
    MiniMapUrl: `${ESOC_IMAGES}/maps/large_maps.png`,
  },
  {
    mapName: 'Asian Maps',
    DisplayName: 'Asian Maps',
    MiniMapUrl: `${ESOC_IMAGES}/maps/asian_maps.png`,
  },
  {
    mapName: 'All Maps',
    DisplayName: 'All Maps',
    MiniMapUrl: `${ESOC_IMAGES}/maps/all_maps.png`,
  },
  {
    mapName: 'Team Maps',
    DisplayName: 'Team Maps',
    MiniMapUrl: `${ESOC_IMAGES}/maps/team_maps.jpg`,
  },
  {
    mapName: 'KnB Maps',
    DisplayName: 'KnB Maps',
    MiniMapUrl: `${ESOC_IMAGES}/maps/kb_maps.png`,
  },
  {
    mapName: 'ESOC Maps',
    DisplayName: 'ESOC Maps',
    MiniMapUrl: `${ESOC_IMAGES}/maps/esoc_maps.jpg`,
  },
  {
    mapName: 'Classic Maps',
    DisplayName: 'Classic Maps',
    MiniMapUrl: `${ESOC_IMAGES}/maps/classic_maps.png`,
  },
  {
    mapName: 'Standard Maps',
    DisplayName: 'Standard Maps',
    MiniMapUrl: `${ESOC_IMAGES}/maps/standard_maps.png`,
  },
];
const MAPS_QUERY = 'SELECT a.alias_id, a.name AS map_name, m.*, p.username FROM esoc.maps_alias a '
  + 'INNER JOIN esoc.maps m ON m.ID = a.alias_id '
  + 'LEFT JOIN phpBB.p_users p ON p.user_id = m.Author';
const ORANGE = 0xFFA500;
const RED = 0xB22222;
const SCENARIO_IMAGE = `${ESOC_IMAGES}/maps/scenario.png`;
const TREATY_PATCH_ICON = `${ESOC_IMAGES}/patch-treaty-icon.png`;
const TREATY_PATCH_EMBED_COLOR = 0x0378c0;
const TWITCH = 'https://www.twitch.tv/';
const TWITCH_API_URI = 'https://api.twitch.tv/helix/';
const TWITCH_CLIENT_ID = 'l075cyh5nw7b2savfoc46nleqh2sg6';
const TWITCH_API_USERS_URI = 'users?id=';
const TWITCH_API_STREAMS_URI = 'streams?game_id=10819';
const TWITCH_OPTIONS = {
  headers: {
    'Client-ID': TWITCH_CLIENT_ID,
  },
  json: true,
  timeout: '30',
};
const UNKNOWN_MAP_IMAGE = `${ESOC_IMAGES}/maps/unknown.png`;
const UPDATE_TWITCH_INTERVAL = 60000; // milli seconds
const UPDATE_INTERVAL_ESOC = 15000; // milli seconds
const XP_MOD_EMBED_COLOR = 0xc27c0e;
const YELLOW = 15204220;

module.exports = {
  AVATAR_QUERY,
  BLUE,
  DARK_ORANGE,
  DEFAULT_AVATAR,
  GOLD,
  GOLD_COUNT,
  GRAY,
  GREEN,
  ESO_POP,
  ESO_QUERY,
  ESOC,
  ESOC_AVATARS,
  ESOC_IMAGES,
  ESOC_LOBBIES_URI,
  ESOC_PATCH_ICON,
  ESOC_PATCH_EMBED_COLOR,
  ESOC_SUPREMACY_TREATY_LADDER,
  ESOC_SUPREMACY_STANDARD_LADDER,
  MAPS,
  MAPS_QUERY,
  ORANGE,
  RED,
  SCENARIO_IMAGE,
  TREATY_PATCH_ICON,
  TREATY_PATCH_EMBED_COLOR,
  TWITCH,
  TWITCH_API_URI,
  TWITCH_CLIENT_ID,
  TWITCH_API_USERS_URI,
  TWITCH_API_STREAMS_URI,
  TWITCH_OPTIONS,
  UPDATE_TWITCH_INTERVAL,
  UPDATE_INTERVAL_ESOC,
  UNKNOWN_MAP_IMAGE,
  XP_MOD_EMBED_COLOR,
  YELLOW,
};

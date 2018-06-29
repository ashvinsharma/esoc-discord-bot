const MAPS = [
  {
    mapName: 'Unknown',
    DisplayName: 'Unknown',
    MiniMapUrl: '/images/aoe3/maps/unknown.png',
  },
  {
    mapName: 'Large Maps',
    DisplayName: 'Large Maps',
    MiniMapUrl: '/images/aoe3/maps/large_maps.png',
  },
  {
    mapName: 'Asian Maps',
    DisplayName: 'Asian Maps',
    MiniMapUrl: '/images/aoe3/maps/asian_maps.png',
  },
  {
    mapName: 'All Maps',
    DisplayName: 'All Maps',
    MiniMapUrl: '/images/aoe3/maps/all_maps.png',
  },
  {
    mapName: 'Team Maps',
    DisplayName: 'Team Maps',
    MiniMapUrl: '/images/aoe3/maps/team_maps.jpg',
  },
  {
    mapName: 'KnB Maps',
    DisplayName: 'KnB Maps',
    MiniMapUrl: '/images/aoe3/maps/kb_maps.png',
  },
  {
    mapName: 'ESOC Maps',
    DisplayName: 'ESOC Maps',
    MiniMapUrl: '/images/aoe3/maps/esoc_maps.jpg',
  },
  {
    mapName: 'Classic Maps',
    DisplayName: 'Classic Maps',
    MiniMapUrl: '/images/aoe3/maps/classic_maps.png',
  },
  {
    mapName: 'Standard Maps',
    DisplayName: 'Standard Maps',
    MiniMapUrl: '/images/aoe3/maps/standard_maps.png',
  },
];
const UPDATE_TWITCH_INTERVAL = 60000; // milli seconds
const UPDATE_INTERVAL_ESOC = 15000; // milli seconds
const ESOC = 'http://eso-community.net';
const TWITCH = 'https://www.twitch.tv/';
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
const MAPS_QUERY = 'SELECT a.alias_id, a.name AS map_name, m.*, p.username FROM esoc.maps_alias a '
  + 'INNER JOIN esoc.maps m ON m.ID = a.alias_id '
  + 'LEFT JOIN phpBB.p_users p ON p.user_id = m.Author';
const GRAY = 0x4f545c;
const GOLD = 0xffa500;
const GOLD_COUNT = 25;

module.exports = {
  MAPS,
  MAPS_QUERY,
  UPDATE_TWITCH_INTERVAL,
  UPDATE_INTERVAL_ESOC,
  ESOC,
  GRAY,
  GOLD,
  GOLD_COUNT,
  TWITCH,
  TWITCH_CLIENT_ID,
  TWITCH_API_USERS_URI,
  TWITCH_API_STREAMS_URI,
  TWITCH_OPTIONS,
};

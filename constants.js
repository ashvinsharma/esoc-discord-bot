const MAPS = [
  {
    mapName: 'unknown',
    DisplayName: 'unknown',
    MiniMapUrl: '/images/aoe3/maps/unknown.png',
  },
  {
    mapName: 'large maps',
    DisplayName: 'large maps',
    MiniMapUrl: '/images/aoe3/maps/large_maps.png',
  },
  {
    mapName: 'asian maps',
    DisplayName: 'asian maps',
    MiniMapUrl: '/images/aoe3/maps/asian_maps.png',
  },
  {
    mapName: 'all maps',
    DisplayName: 'all maps',
    MiniMapUrl: '/images/aoe3/maps/all_maps.png',
  },
  {
    mapName: 'team maps',
    DisplayName: 'team maps',
    MiniMapUrl: '/images/aoe3/maps/team_maps.jpg',
  },
  {
    mapName: 'knb maps',
    DisplayName: 'knb maps',
    MiniMapUrl: '/images/aoe3/maps/kb_maps.png',
  },
  {
    mapName: 'esoc maps',
    DisplayName: 'esoc maps',
    MiniMapUrl: '/images/aoe3/maps/esoc_maps.jpg',
  },
  {
    mapName: 'classic maps',
    DisplayName: 'classic maps',
    MiniMapUrl: '/images/aoe3/maps/classic_maps.png',
  },
  {
    mapName: 'standard maps',
    DisplayName: 'standard maps',
    MiniMapUrl: '/images/aoe3/maps/standard_maps.png',
  },
];

const MAPS_QUERY = 'SELECT a.alias_id, a.name AS map_name, m.*, p.username FROM esoc.maps_alias a '
+ 'INNER JOIN esoc.maps m ON m.ID = a.alias_id '
+ 'LEFT JOIN phpBB.p_users p ON p.user_id = m.Author';

module.exports = {
  MAPS,
  MAPS_QUERY,
};

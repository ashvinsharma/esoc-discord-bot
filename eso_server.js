const Socket = require('socket.io');
const fs = require('fs');


const _game_modes = ['Supremacy', 'Deathmatch'];
const _PATCH_ESOC = 1;
const _PATCH_TREATY = 2;
const _PATCH_XPMOD = 2;


class Game {
    constructor() {
        this.players = new List();
        this.deleted = false;
        this.restorable = false;
        this.patch = null;
        this.game_mode = null;
        this.lastPong = 0;
    }

    setPatch(patch) {
        this.patch = patch;
    }

    _update(data) {
        this.lastPong = Date.now();

        let g = data.find('g');

        if (typeof g == 'undefined')
            throw "Not a game packet";

        let st = g.find('st');

        this.name = g.find('n').toString();
        this.id = g.find('id').toString();
        this.password = (g.find('p').toString() == 'true');

        if (this.game_mode == null)
            this.game_mode = g.find('gm').toInt();

        this.map = st.find('s10').toString();

        this.treaty_time = st.find('s36').toInt();

        this.allow_cheats = (st.find('s29').toString() == 'true');
        this.max_players = st.find('s4').toInt();

        this.starting_age = st.find('s24').toInt();
        this.game_speed = st.find('s25').toInt();

        this.monopoly = (st.find('s37').toString() == 'true');
        this.no_blockade = (st.find('s38').toString() == 'true');
        this.koth = (st.find('s42').toString() == 'true');

        this.scenario = (st.find('s42').toString() == 'true');

        this.min_hc = st.find('s33').toInt();
        this.max_hc = st.find('s34').toInt();

        //Add players

        for (let i = 0; i < 8; i++) {
            let pstr = 's' + String(82 + 24 * i);
            let p = st.find(pstr);

            if (typeof p != "undefined")
                this.players.add(p.toString());
        }

    }

    getGameUrl() {
        if (this.patch == 2)
            return 'http://eso-community.net/ladder.php?patch=official&type=treaty&mode=overall&player=' + this.getHost();
        else
            return 'http://eso-community.net/ladder.php?patch=esoc&type=supremacy&mode=overall&player=' + this.getHost()
    }

    getPatchThumbnail() {
        if (this.patch == 1)
            return 'http://eso-community.net/images/aoe3/patch-esoc-icon.png';
        else if (this.patch == 2)
            return 'http://eso-community.net/images/aoe3/patch-treaty-icon.png';
        else
            return null;
    }

    getPatchName() {
        if (this.patch == 1)
            return 'ESOC Patch';
        else if (this.patch == 2)
            return 'Treaty Patch';
        else if (this.patch === 3)
            return 'XPMOD';
        else
            return null;
    }

    getPatchColorIndex() {
        try {
            return this.patch - 1;
        }
        catch (e) {
            console.log(e.message);
            return null;
        }
    }

    getHost() {
        return this.players[0];
    }

    getPlayerCount() {
        return this.players.length;
    }

    getPrettyGameMode() {
        let s;
        if (this.treaty_time > 0) {
            s = 'Treaty ' + this.treaty_time.toString() + ' min.';
            if (this.no_blockade)
                s += ' - No blockade';
        }
        else if (this.scenario)
            s = 'Scenario';
        else if (this.koth)
            s = 'King of the Hill';
        else if (this.game_mode == 0) {
            s = 'Supremacy - ';

            if (this.monopoly)
                s += 'Standard';
            else
                s += 'Classic';
        }
        else if (this.game_mode == 1)
            s = 'Deathmatch';
        else
            s = 'Unknown game mode';

        return s;

    }

    getPrettyGameSpeed() {
        return ['Slow', 'Medium', 'Fast'][this.game_speed];
    }

    getPrettyStatingAge() {
        return ['Discovery', 'Colonial', 'Fortress', 'Industrial', 'Post-Industrial', 'Imperial', 'Post-Imperial'][this.starting_age];
    }

    getPrettyCityLevels() {
        let s;
        if (this.min_hc == -1 && this.max_hc == -1)
            s = 'Unlimited'
        else if (this.max_hc == -1)
            s = this.min_hc.toString() + ' - Infinite';
        else
            s = this.min_hc.toString() + ' - ' + this.max_hc.toString();

        return s;
    }

    getPrettyMap() {
        if (this.patch in [1, 3]) {
            if (this.map == 'Largerandommaps')
                return 'Classic Maps';
            else if (this.map == 'asianrandom')
                return 'ESOC Maps';
            else if (this.map == 'featured')
                return 'KnB Maps';
            else if (this.map == 'randommaps')
                return 'Team Maps'
        }
        else if (this.map == 'Largerandommaps')
            return 'Large Maps';
        else if (this.map == 'asianrandom')
            return 'Asian Maps';
        else if (this.map == 'fastrandom')
            return 'Standard Maps';
        else if (this.map == 'randommaps')
            return 'All Maps'
        else
            return this.map;

    }

    dumpLobbiesToJson(games) {
        let gamesSanitized = [];
        for (addr in games)
            gamesSanitized.push(games[addr]);

        let outfile = '/esoc/assets/patch/api/lobbies.json';
        fs.writeFileSync(outfile, JSON.stringify(gamesSanitized));

        let pickleFile = '/esoc/discord-bot/lobbies_pickle.json';
        fs.writeFileSync(pickleFile, JSON.stringify(games));

    }

    * cleanupDeadGames(games) {
        for (addr; game in games.items.toArray; addr++) {
            if (!game.hasAttribute('name') || (game.deleted && !game.restorable) || (game.deleted && Date.now() - game.lastPong > 60)) {
                console.log('Cleaning up deleted/invalid games.');
                // if this was a valid game, notify discord to delete it as well
                if (game.hasAttribute('name'))
                    yield game;
                games.delete(addr);
            }
        }
    }

    * listenForLobbies() {
        try {
            let lobbiesRecoveryFile = '/esoc/discord-bot/lobbies_pickle.json';
            let recoveryDataJson = fs.readFileSync(lobbiesRecoveryFile);

            if (recoveryDataJson != '') {
                console.log('Restoring state after server restart');
                games = JSON.parse(recoveryDataJson);

                for (addr; game in games; addr++) {
                    if (game.hasAttribute('name')) {
                        console.log('Yielding restored games');
                        yield game;
                    }
                    else {
                        //remove invalid games
                        console.log('Removing invalid games.');
                        games.delete(addr);
                    }
                }
            }
            else
                games = {};
        }
        catch (e) {
            console.log(e.message);
            console.log('Failed to restore state, falling back to default state');
            games = {};
        }

        let s = new Socket('0.0.0.0:2300');
        s.setTimeout(1);
        console.log('Started server on port 2300');
        let packet = '';
        s.receiveBuffer(4096);

        while (true) {
            try {
                packet, addrPair = s.receiveBuffer;
                packet = packet.replace('\x00', '');

                addr, port = addrPair.toArray
                game = games.get(addr, Game())

                if (packet == 'PONG') {
                    console.log('Received PONG from ' + addr.toString());
                    game.lastPong = Date.now();
                    if (game.deleted && game.restorable && game.hasAttribute('name')) {
                        console.log('Restoring deleted game.');
                        game.deleted = false;
                        this.dumpLobbiesToJson(games);
                        yield game;
                    }
                    else if (!game.hasAttribute('name'))
                        games.delete(addr);
                    continue;
                }
                const ElementTree = require('elementtree');
                let data = ElementTree.ElementTree.fromString(packet);

                if (data[0].tag == 'g') {
                    if (game.deleted && data.attrib['tp'] == 'add') {
                        game.deleted == false;
                        game.update(data);
                    }
                    else if (data.attrib['tp'] == 'update')
                        game.update(data)
                    else if (data.attrib['tp'] in ('remove', 'logoff'))
                        game.deleted == true;

                }
                else if (data[0].tag == 'm') {
                    let m = data.find('m');
                    if (data.attrib['tp'] == 'patch') {
                        try {
                            game.setPatch(m.toInt())
                        }
                        catch (e) {
                            continue;
                        }
                    }
                    else if (m.toString() in ('IG', 'OFF', 'ON')) {
                        game.deleted = true;
                        game.restorable = false;
                    }
                }
                if (!game.hasAttribute('name'))
                    games.delete(addr);
                else if (game.host != null) {
                    yield game;
                    games[addr] = game;
                }

                for (deadGame in this.cleanupDeadGames(games))
                    yield deadGame;
                this.dumpLobbiesToJson(games);
            }
            catch(e){
                for (addr; game in games; addr++){
                    if (!game.deleted && game.lastPong != 0 && Date.now() - game.lastPong > 15){
                        console.log('Client ' + addr + ' dropped due to inactivity');
                        game.deleted = true;
                        //Allow client to restore this game if they start communication again
                        game.restorable = true;
                        yield game;
                    }
                }
                for (deadGame in this.cleanupDeadGames(games))
                    yield deadGame;
                this.dumpLobbiesToJson(games);

                console.log(packet)
                let pickleFile = '/esoc/discord-bot/lobbies_pickle_debug.json';
                fs.writeFileSync(pickleFile, JSON.stringify(games));
            }
        }



    }

}

module.exports = Game;

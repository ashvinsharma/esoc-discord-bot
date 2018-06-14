const request = require('request-promise');
const fs = require('fs');

const clientID = 'l075cyh5nw7b2savfoc46nleqh2sg6';

const prefixJsonData = 'user_';

const apiTwitch = 'https://api.twitch.tv/helix/';
const apiUsers = 'users?id=';
const apiStreams = 'streams?game_id=10819';

const updateInterval = 60000; // ms and not seconds.

const schedulesURL = 'http://eso-community.net/app.php/current-streams-schedule';

const optionsTwitch = {
    headers: {
        'Client-ID': clientID
    },
    json: true,
    timeout: '30'
};

const optionsSchedules = {
    uri: schedulesURL,
    timeout: '30',
    json: true
}

class Twitch {

    static _getSchedules() {
        let data;

        try {
            data = request.get(optionsSchedules);
        } catch (e) {
            console.log(e.message);
        }
        return data;
    }

    static async _getUserFromCache(userID) {
        let user = prefixJsonData + userID;
        let writer;

        let file = fs.readFileSync('user.json', 'utf8');
        file = JSON.parse(file);

        if (file[user]) return file[user];
        else {
            writer = await this._writeToCache(userID, user, file);
            return writer;
        }
    }

    static async _writeToCache(userID, user, file) {
        let data;
        let req;
        let temp;
        try {
            req = request.get(apiTwitch + apiUsers + userID.toString(), optionsTwitch);
            temp = await req.then((res) => {
                data = res.data[0];                                            //We are doing this
                data = JSON.stringify(data, ['id', 'login', 'display_name']);   // to keep only
                data = JSON.parse(data);                                        // the data we need.

                file[user] = data;
                file = JSON.stringify(file, null, '  '); //Pretty stringify the object in JSON.
                fs.writeFileSync('user.json', file); //We write back the object to the file.
                console.log(JSON.stringify(data) + "wololo");
                return data;
            }).catch();
        } catch (e) {
            console.log(e.message);
        }
        return temp;

    }

    static async _getUserPromise(userID) {
        let userData;
        let cacheUsers;

        if (fs.existsSync('user.json')) {

            cacheUsers = await this._getUserFromCache(userID);
            userData = cacheUsers;
        } else {
            try {
                let user = prefixJsonData + userID;
                let file = {};
                let writer;
                writer = await this._writeToCache(userID, user, file);

                userData = writer;

            } catch (e) {

            }
        }
        return userData;

    }

    static async getUser(userID) {
        let user;
        try {
            user = await this._getUserPromise(userID);
        } catch (err) {
            console.log(err.message);
        }
        return user;
    }

    static _getStreams() {
        return new Promise((resolve, reject) => {
            request(apiTwitch + apiStreams, optionsTwitch, function (err, response, body) {
                if (err) {
                    return reject(err);
                }
                resolve(body.data);
            });
        });
    }

    static async getStream() {
        let streams;
        let users = {};

        try {
            streams = await this._getStreams();
            for (let stream of streams) {
                console.log(stream.user_id);
                users['user_' + stream.user_id] = await this.getUser(stream.user_id);
            }
        } catch (err) {
            console.error(err);
        }
        return {streams, users};
    }


}

/*
class Streams{

    constructor(type, stream, schedule, response, lastSeen){
        this._type = type;
        this._stream = stream;
        this._schedule = schedule;
        this._response = response;
        this._lastSeen = lastSeen;
    }

    updateInfo(data) {
        this._stream = data;

        this._lastSeen = Date.now();

        let url = this.ge

    }
}*/


module.exports = Twitch;
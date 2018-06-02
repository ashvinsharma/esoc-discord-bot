const request = require('request-promise');
const sleep = require('await-sleep');
const fs = require('fs');

const clientID = 'l075cyh5nw7b2savfoc46nleqh2sg6';

const prefixJsonData = 'user_';

const twitchUrl = "https://www.twitch.tv/";
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

    static _getStreams() {
        let data;

        try {
            data = request.get(apiTwitch + apiStreams, optionsTwitch);
        } catch (e) {
            console.log(e.message)
        }
        return data;
    }

    static _getSchedules() {
        let data;

        try {
            data = request.get(optionsSchedules);
        } catch (e) {
            console.log(e.message);
        }
        return data;
    }

    static async _getUserFromCache(resolve, reject, userID) {
        let user = prefixJsonData + userID;
        let writer;

        fs.readFile('user.json', 'utf8', (err, file) => {
            if (err) reject(err);

            file = JSON.parse(file);

            if (file[user]) resolve(file[user]);
            else {
                writer = new Promise((resolve) => {
                    this._writeToCache(resolve, userID, user, file)
                });
                writer.then(data => {
                    resolve(data);
                }).catch(err => {
                    reject(err)
                })
            }

        })
    }

    static async _writeToCache(resolve, userID, user, file) {
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
                resolve(data);
            }).catch();
        } catch (e) {
            console.log(e.message);
        }

    }

    static async _getUser(userID) {
        let userData;
        let cacheUsers;

        if (fs.existsSync('user.json')) {

            cacheUsers = new Promise((resolve, reject) => {
                this._getUserFromCache(resolve, reject, userID)
            });
            userData = cacheUsers;
        } else {
            try {
                let user = prefixJsonData + userID;
                let file = {};
                let writer;
                writer = new Promise((resolve) => {
                    this._writeToCache(resolve, userID, user, file)
                });

                userData = writer;

            } catch (e) {

            }
        }
        return userData;

    }

    static async Streams() {
        let cache;

        let streams;
        let schedules;


        while (1) {
            let streamsPromise = await this._getStreams().then(function (data) {
                streams = data.data;
                console.log(JSON.stringify(streams))
            });
            let schedulesPromise = await this._getSchedules().then(function (data) {
                // console.log(JSON.stringify(data));
                schedules = data;
            });

            if (typeof streams != 'undefined') {

                let data = {};

                for (data of streams) {
                    let userData;
                    let userPromise = await this._getUser(data.user_id).then((res) => {
                        userData = res;
                        console.log(JSON.stringify(userData.display_name))
                    }).catch(e => console.log(e));
                }

            }
            await sleep(updateInterval);
        }
    }

    updateInfo(data) {
        this._stream = data;

        this._lastSeen = Date.now();


    }
}


module.exports = Twitch;
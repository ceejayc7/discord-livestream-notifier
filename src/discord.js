import Bot from './bot.js';
import Twitch from './twitch.js';
import Youtube from './youtube.js';
import Localhost from './localhost.js';
import Mixer from './mixer.js';
import OkRu from './okru.js';
import { EventEmitter } from 'events';
import { DISCORD_TOKENS } from './constants.js';
import _ from 'lodash';

const streamEmitter = new EventEmitter(),
    serverDatabase = require('./db.json'),
    serverList = Object.keys(serverDatabase),
    discordBots = {},
    streamsList = [],
    ignoreLowercasePlatforms = ["youtube", "okru"];

function initBots() {
    // create new bot per each defined discord server
    _.forEach(serverList, (server) => {
        let loginToken = _.get(DISCORD_TOKENS, server);
        if(loginToken) {
            discordBots[server] = new Bot(loginToken);
            discordBots[server].attachListeners();
            discordBots[server].loginToDiscord();
        }
    });

    const twitch = new Twitch(streamEmitter),
        localhost = new Localhost(streamEmitter),
        mixer = new Mixer(streamEmitter),
        youtube = new Youtube(streamEmitter),
        okru = new OkRu(streamEmitter);

    streamsList.push(twitch);
    streamsList.push(localhost);
    streamsList.push(mixer);
    streamsList.push(youtube);
    streamsList.push(okru);
}

function setTimers() {
    const TIME_TO_PING_API = 60000, //300000,
        FIRST_API_PING = 30000;
    _.forEach(streamsList, (stream) => {
        setInterval(stream.updateStreams, TIME_TO_PING_API); // continously call API refresh every 5 minutes
        setTimeout(stream.updateStreams, FIRST_API_PING); // on inital timer set, call API after 30 seconds to allow discord bots to log in
    });
}

initBots();
setTimers();

function getStreamName(stream) {
    return _.includes(ignoreLowercasePlatforms, stream.platform) ? stream.name : stream.name.toLowerCase();
}

streamEmitter.on('event:streamlive', (stream) => {
    _.forEach(serverDatabase, (server, serverName) => {
        let isChannelInServer = _.includes(_.get(server,[stream.platform]), getStreamName(stream));
        if(isChannelInServer) {
            console.log(`${stream.name} went live, notifying channel`);
            discordBots[serverName].sendLiveMessage(stream);
        }
    });
});
import Bot from './bot';
import Twitch from './twitch';
import Youtube from './youtube';
import Mixer from './mixer';
import OkRu from './okru';
import Vlive from './vlive';
import { EventEmitter } from 'events';
import { DISCORD_TOKENS } from './constants';
import _ from 'lodash';

const streamEmitter = new EventEmitter();
const serverDatabase = require('./db.json');
const serverList = Object.keys(serverDatabase);
const discordBots = {};
const streamsList = [];
const ignoreLowercasePlatforms = ['youtube', 'okru'];

function initBots() {
  // create new bot per each defined discord server
  _.forEach(serverList, (server) => {
    const loginToken = _.get(DISCORD_TOKENS, server);
    if (loginToken) {
      discordBots[server] = new Bot(loginToken);
      discordBots[server].attachListeners();
      discordBots[server].loginToDiscord();
    }
  });

  const twitch = new Twitch(streamEmitter);
  const mixer = new Mixer(streamEmitter);
  const youtube = new Youtube(streamEmitter);
  const okru = new OkRu(streamEmitter);
  const vlive = new Vlive(streamEmitter);

  streamsList.push(twitch);
  streamsList.push(mixer);
  streamsList.push(youtube);
  streamsList.push(okru);
  streamsList.push(vlive);
}

function setTimers() {
  const TIME_TO_PING_API = 300000;
  const FIRST_API_PING = 30000;
  _.forEach(streamsList, (stream) => {
    setInterval(stream.updateStreams, TIME_TO_PING_API); // continously call API refresh every 5 minutes
    setTimeout(stream.updateStreams, FIRST_API_PING); // on inital timer set, call API after 30 seconds to allow discord bots to log in
  });
}

initBots();
setTimers();

function getStreamName(stream) {
  return _.includes(ignoreLowercasePlatforms, stream.platform)
    ? stream.name
    : stream.name.toLowerCase();
}

streamEmitter.on('event:streamlive', (stream) => {
  _.forEach(serverDatabase, (server, serverName) => {
    const isChannelInServer = _.includes(_.get(server, [stream.platform]), getStreamName(stream));
    if (isChannelInServer) {
      console.log(`${stream.name} went live, notifying channel`);
      discordBots[serverName].sendLiveMessage(stream);
    }
  });
});

import { getKpopChannels, printOverrides } from '@root/util';

import Afreeca from '@stream/afreeca';
import Bot from '@root/bot';
import { IPTV } from '@root/iptv';
import { KPOP_SCHEDULE } from '@root/kpop';
import Twitch from '@stream/twitch';
import Vlive from '@stream/vlive';
import Youtube from '@stream/youtube';
import _ from 'lodash';
import moment from 'moment-timezone';
import { onBotStart as setCryptoMetadata } from '@root/crypto';

const SERVER_DATABASE = require('@data/db.json');
const discordBots = {};
const OVERRIDES = require('@data/constants.json').overrides;

const sendStreamMessageToServers = (streamData) => {
  const { stream } = streamData;
  _.forEach(SERVER_DATABASE, (server, serverName) => {
    const isChannelInServer = _.includes(_.get(server, [stream.platform]), stream.name);
    if (isChannelInServer) {
      console.log(`${stream.name} went live, notifying channel`);
      discordBots[serverName].sendLiveMessage(streamData);
    }
  });
};

const createLivestreams = () => {
  const silentMode = OVERRIDES?.silentMode ? true : false;

  return [
    new Twitch(sendStreamMessageToServers, silentMode),
    new Youtube(sendStreamMessageToServers, silentMode),
    new Vlive(sendStreamMessageToServers, silentMode),
    new Afreeca(sendStreamMessageToServers, silentMode)
  ];
};

const initBots = async () => {
  const serverConfig = require('@data/constants.json').serverConfig;
  const serverList = Object.keys(SERVER_DATABASE);

  // create new bot per each defined discord server
  for (const server of serverList) {
    const discordToken = serverConfig?.[server]?.discordToken;
    if (discordToken) {
      discordBots[server] = new Bot(serverConfig[server], server);
      discordBots[server].attachListeners();
      await discordBots[server].loginToDiscord();
    } else {
      const error = `Discord token for ${server} doesn't exist`;
      throw new Error(error);
    }
  }
};

const setMusicShowPolling = () => {
  const OFFSET_IN_SECONDS = 900;
  const ONE_WEEK = 604800;
  const channels = getKpopChannels(discordBots);

  if (!_.isEmpty(channels)) {
    for (const event of KPOP_SCHEDULE) {
      if (event?.sendIPTV) {
        let timeWhenEventStarts = (event.time() - moment.tz().unix() - OFFSET_IN_SECONDS) * 1000;
        if (timeWhenEventStarts < 0) {
          timeWhenEventStarts = 0;
        }
        console.log(
          `Setting timer on ${event.show} on ${event.day} at ${event.time() - OFFSET_IN_SECONDS}`
        );
        setTimeout(() => IPTV.sendIPTVStreams(event, channels), timeWhenEventStarts);
      }
    }

    // reset weekly timer in 1 week
    console.log(`Setting weekly timer reset at ${ONE_WEEK + moment.tz().unix()}`);
    setTimeout(setMusicShowPolling, ONE_WEEK * 1000);
  }
};

const setLivestreamPolling = (streamsList) => {
  for (const stream of streamsList) {
    setInterval(stream.updateStreams, stream.apiRefreshInterval); // refresh api
    stream.updateStreams();
  }
};

const start = async () => {
  printOverrides();
  await initBots();
  (OVERRIDES?.enableCryptoStartup === undefined || OVERRIDES?.enableCryptoStartup === true) &&
    setCryptoMetadata();
  const streamsList = createLivestreams();
  setLivestreamPolling(streamsList);
  setMusicShowPolling();
};

start();

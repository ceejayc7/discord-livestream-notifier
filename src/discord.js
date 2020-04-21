import { getKpopChannels, printOverrides } from '@root/util';

import Afreeca from '@stream/afreeca';
import Bot from '@root/bot';
import { IPTV } from '@root/iptv';
import { KPOP_SCHEDULE } from '@root/kpop';
import Mixer from '@stream/mixer';
import OkRu from '@stream/okru';
import Twitch from '@stream/twitch';
import Vlive from '@stream/vlive';
import Youtube from '@stream/youtube';
import _ from 'lodash';
import moment from 'moment-timezone';

const SERVER_DATABASE = require('@data/db.json');
const CONSTANTS = require('@data/constants.json').serverConfig;
const OVERRIDES = require('@data/constants.json').overrides;
const serverList = Object.keys(SERVER_DATABASE);
const discordBots = {};
const streamsList = [];
const silentMode = OVERRIDES?.silentMode ? true : false;

printOverrides();

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

const initBots = async () => {
  // create new bot per each defined discord server
  for (const server of serverList) {
    const loginToken = CONSTANTS?.[server]?.discordToken;
    if (loginToken) {
      discordBots[server] = new Bot(loginToken, server);
      discordBots[server].attachListeners();
      await discordBots[server].loginToDiscord();
    } else {
      const error = `Discord token for ${server} doesn't exist`;
      throw new Error(error);
    }
  }

  streamsList.push(
    new Twitch(sendStreamMessageToServers, silentMode),
    new Mixer(sendStreamMessageToServers, silentMode),
    new Youtube(sendStreamMessageToServers, silentMode),
    new OkRu(sendStreamMessageToServers, silentMode),
    new Vlive(sendStreamMessageToServers, silentMode),
    new Afreeca(sendStreamMessageToServers, silentMode)
  );
};

const setMusicShowTimers = () => {
  const OFFSET_IN_SECONDS = 960;
  const ONE_WEEK = 604800;
  const channels = getKpopChannels(discordBots);

  if (!_.isEmpty(channels)) {
    KPOP_SCHEDULE.forEach((event) => {
      let timeWhenEventStarts = (event.time() - moment.tz().unix() - OFFSET_IN_SECONDS) * 1000;
      if (timeWhenEventStarts < 0) {
        timeWhenEventStarts = 0;
      }
      console.log(
        `Setting timer on ${event.show} on ${event.day} at ${event.time() - OFFSET_IN_SECONDS}`
      );
      setTimeout(() => IPTV.sendIPTVStreams(event, channels), timeWhenEventStarts);
    });

    // reset weekly timer in 1 week
    console.log(`Setting weekly timer reset at ${ONE_WEEK + moment.tz().unix()}`);
    setTimeout(setMusicShowTimers, ONE_WEEK * 1000);
  }
};

const setLivestreamTimers = () => {
  const TIME_TO_PING_API = 300000;
  for (const stream of streamsList) {
    setInterval(stream.updateStreams, TIME_TO_PING_API); // continously call API refresh every 5 minutes
    stream.updateStreams();
  }
};

const start = async () => {
  await initBots();
  setLivestreamTimers();
  setMusicShowTimers();
};

start();

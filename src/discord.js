import { DISCORD_TOKENS, SEND_KPOP_IPTV } from '@root/constants';

import Bot from '@root/bot';
import { EventEmitter } from 'events';
import { IPTV } from '@root/iptv';
import { KPOP_SCHEDULE } from '@root/kpop';
import Mixer from '@stream/mixer';
import OkRu from '@stream/okru';
import Twitch from '@stream/twitch';
import Vlive from '@stream/vlive';
import Youtube from '@stream/youtube';
import _ from 'lodash';
import moment from 'moment-timezone';

const serverDatabase = require('@data/db.json');

const streamEmitter = new EventEmitter();
const serverList = Object.keys(serverDatabase);
const discordBots = {};
const streamsList = [];

const initBots = () => {
  // create new bot per each defined discord server
  _.forEach(serverList, (server) => {
    const loginToken = _.get(DISCORD_TOKENS, server);
    if (loginToken) {
      discordBots[server] = new Bot(loginToken);
      discordBots[server].attachListeners();
      discordBots[server].loginToDiscord();
    }
  });

  streamsList.push(new Twitch(streamEmitter));
  streamsList.push(new Mixer(streamEmitter));
  streamsList.push(new Youtube(streamEmitter));
  streamsList.push(new OkRu(streamEmitter));
  streamsList.push(new Vlive(streamEmitter));
};

const setMusicShowTimers = () => {
  const OFFSET_IN_SECONDS = 960;
  const ONE_WEEK = 604800;
  const server = _.get(discordBots, SEND_KPOP_IPTV.server);

  if (!_.isEmpty(SEND_KPOP_IPTV) && server) {
    KPOP_SCHEDULE.forEach((event) => {
      const channelToSendTo = server.client.channels.cache.get(SEND_KPOP_IPTV.channelId);
      let timeWhenEventStarts = (event.time() - moment.tz().unix() - OFFSET_IN_SECONDS) * 1000;
      if (timeWhenEventStarts < 0) {
        timeWhenEventStarts = 0;
      }
      console.log(
        `Setting timer on ${event.show} on ${event.day} at ${event.time() - OFFSET_IN_SECONDS}`
      );
      setTimeout(() => IPTV.sendIPTVStreams(event, channelToSendTo), timeWhenEventStarts);
    });

    // reset weekly timer in 1 week
    console.log(`Setting weekly timer reset at ${ONE_WEEK + moment.tz().unix()}`);
    setTimeout(setMusicShowTimers, ONE_WEEK * 1000);
  }
};

const setTimers = () => {
  const TIME_TO_PING_API = 300000;
  const FIRST_API_PING = 30000;
  _.forEach(streamsList, (stream) => {
    setInterval(stream.updateStreams, TIME_TO_PING_API); // continously call API refresh every 5 minutes
    setTimeout(stream.updateStreams, FIRST_API_PING); // on inital timer set, call API after 30 seconds to allow discord bots to log in
  });
  setTimeout(setMusicShowTimers, FIRST_API_PING); // wait for bot login before setting music show timers
};

initBots();
setTimers();

streamEmitter.on('event:streamlive', (streamData) => {
  const { stream } = streamData;
  _.forEach(serverDatabase, (server, serverName) => {
    const isChannelInServer = _.includes(_.get(server, [stream.platform]), stream.name);
    if (isChannelInServer) {
      console.log(`${stream.name} went live, notifying channel`);
      discordBots[serverName].sendLiveMessage(streamData);
    }
  });
});

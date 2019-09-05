import { getLatestTweets, filterForValidEvents, isTwitterProtected } from './twitter';
import _ from 'lodash';
import { Helpers } from './helpers';
import { getValidIPTVStreamsFromList, createMessageToSend } from './iptv';

const printKpopMessage = (msg) => async (tweets) => {
  if (_.isEmpty(tweets)) {
    Helpers.sendMessageToChannel(msg, `kpop is dead`);
  }
  const isProtected = await isTwitterProtected();
  for (const tweet of tweets) {
    Helpers.sendMessageToChannel(
      msg,
      `${tweet.showName}\n> PST: **${tweet.time.pst.time}** on ${tweet.time.pst.date}\n> EST: **${
        tweet.time.est.time
      }** on ${tweet.time.est.date}\n${isProtected ? '```' + tweet.text + '```' : tweet.link}`
    );
  }
};

export const parseIPTVCommand = (msg) => {
  const { content } = msg;
  const index = content.indexOf(' ');
  if (index > 0) {
    const channel = content.substring(index + 1);
    Helpers.sendMessageToChannel(msg, `Generating streams for ${channel}...`);
    getValidIPTVStreamsFromList(channel)
      .then(createMessageToSend)
      .then((streams) => Helpers.sendMessageToChannel(msg, streams));
  } else {
    Helpers.sendMessageToChannel(msg, `Usage: !iptv (channel name)`);
  }
};

export const onKpopCommand = (msg) => {
  getLatestTweets()
    .then(filterForValidEvents)
    .then(printKpopMessage(msg))
    .catch((error) => {
      Helpers.sendMessageToChannel(msg, `Sorry bro, something went wrong`);
      console.log(`An error occured on !kpop. ${error}`);
    });
};

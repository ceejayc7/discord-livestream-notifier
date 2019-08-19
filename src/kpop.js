import { getLatestTweets, isEventInFuture } from './twitter';
import _ from 'lodash';
import { Helpers } from './helpers';
import { getValidIPTVStreamsFromList, createMessageToSend } from './iptv';

const printKpopMessage = (msg) => (firstTweet) => {
  if (isEventInFuture(firstTweet)) {
    Helpers.sendMessageToChannel(
      msg,
      `${firstTweet.showName}\n> PST: **${firstTweet.time.pst.time}** on ${
        firstTweet.time.pst.date
      }\n> EST: **${firstTweet.time.est.time}** on ${firstTweet.time.est.date}\n${firstTweet.link}`
    );
  } else {
    Helpers.sendMessageToChannel(msg, `kpop is dead`);
  }
};

export const parseGenerate = (msg) => {
  const message = msg.content;
  const index = message.indexOf(' ');
  if (index > 0) {
    const channel = message.substring(index + 1);
    Helpers.sendMessageToChannel(msg, `Generating streams for ${channel}...`);
    getValidIPTVStreamsFromList(channel)
      .then(createMessageToSend)
      .then((streams) => Helpers.sendMessageToChannel(msg, streams));
  } else {
    Helpers.sendMessageToChannel(msg, `!generate (channel name)`);
  }
};

export const onKpopCommand = (msg) => {
  getLatestTweets()
    .then(_.first)
    .then(printKpopMessage(msg))
    .catch((error) => {
      Helpers.sendMessageToChannel(msg, `Sorry bro, something went wrong`);
      console.log(`An error occured on !kpop. ${error}`);
    });
};

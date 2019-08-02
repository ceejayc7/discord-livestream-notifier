import { getLatestTweets, isEventInFuture } from './twitter';
import _ from 'lodash';
import { Helpers } from './helpers.js';

const printKpopMessage = msg => firstTweet => {
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

export function onKpopCommand(msg) {
  getLatestTweets()
    .then(_.first)
    .then(printKpopMessage(msg))
    .catch(error => {
      Helpers.sendMessageToChannel(msg, `Sorry bro, something went wrong`);
      console.log(`An error occured on !kpop. ${error}`);
    });
}

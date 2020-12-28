import _ from 'lodash';
import { getTimeline } from '@root/twitter';
import { sendMessageToChannel } from '@root/util';
import { default as twitterHandles } from '@data/cosplay.json';

const getRandomTwitterHandle = () => _.sample(twitterHandles);

const getTweet = async (handle) => {
  try {
    const tweets = await getTimeline(handle);
    return _.filter(tweets, (tweet) => tweet?.entities?.media);
  } catch (err) {
    console.log(`Unable to retrieve tweets for ${handle}`);
    console.log(JSON.stringify(err));
    return [];
  }
};

export const sendCosplayTweet = async (msg) => {
  const twitterUser = getRandomTwitterHandle();
  const tweets = await getTweet(twitterUser);
  if (tweets && tweets.length) {
    const tweet = _.sample(tweets);
    const link = `|| https://twitter.com/${twitterUser}/status/${tweet.id_str} ||`;
    sendMessageToChannel(msg, link);
  }
};

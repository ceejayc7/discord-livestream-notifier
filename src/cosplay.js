import _ from 'lodash';
import request from 'request-promise';
import { sendMessageToChannel } from '@root/util';
import { default as twitterHandles } from '@data/cosplay.json';
import { setTimeout } from 'timers/promises';

const TOKENS = require('@data/constants.json')?.tokens?.cosplay;

const getRandomTwitterHandle = () => _.sample(twitterHandles);

const getTweet = async (retry = 0) => {
  const userId = getRandomTwitterHandle();
  try {
    const httpOptions = {
      url: `https://twitter154.p.rapidapi.com/user/medias`,
      headers: {
        'X-RapidAPI-Key': TOKENS.KEY,
        'X-RapidAPI-Host': TOKENS.HOST
      },
      qs: {
        user_id: userId,
        limit: 20
      },
      json: true
    };
    const result = await request(httpOptions);
    if (result?.results?.length) {
      return result;
    }

    const nextRetry = retry + 1;
    if (nextRetry >= 60) {
      console.log(`Unable to retrieve tweets for ${userId} after ${nextRetry} tries`);
      console.log(JSON.stringify(result));
      return {};
    }
    console.log(`Retry ${nextRetry} for ${userId}`);
    console.log(JSON.stringify(result));
    await setTimeout(1000, 'resolved');
    return getTweet(nextRetry);
  } catch (err) {
    console.log(`Unable to retrieve tweets for ${userId}`);
    console.log(JSON.stringify(err));
    return {};
  }
};

export const sendCosplayTweet = async (msg) => {
  const tweets = await getTweet();
  if (tweets?.results?.length) {
    const tweet = _.sample(tweets.results);
    const link = `|| https://vxtwitter.com/${tweet?.user?.username}/status/${tweet.tweet_id} ||`;
    sendMessageToChannel(msg, link);
  } else {
    console.log('Unable to send cosplay tweet');
    console.log(tweets);
  }
};

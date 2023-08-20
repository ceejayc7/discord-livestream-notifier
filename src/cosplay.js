import _ from 'lodash';
import request from 'request-promise';
import { sendMessageToChannel } from '@root/util';
import { default as twitterHandles } from '@data/cosplay.json';

const TOKENS = require('@data/constants.json')?.tokens?.cosplay;

const getRandomTwitterHandle = () => _.sample(twitterHandles);

const getTweet = async (userId) => {
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
    return request(httpOptions);
  } catch (err) {
    console.log(`Unable to retrieve tweets for ${userId}`);
    console.log(JSON.stringify(err));
    return {};
  }
};

export const sendCosplayTweet = async (msg) => {
  const twitterUserId = getRandomTwitterHandle();
  const tweets = await getTweet(twitterUserId);
  if (tweets?.results?.length) {
    const tweet = _.sample(tweets.results);
    const link = `|| https://vxtwitter.com/${tweet?.user?.username}/status/${tweet.tweet_id} ||`;
    sendMessageToChannel(msg, link);
  } else {
    console.log(`Unable to retrieve tweets for ${twitterUserId}`);
    console.log(tweets);
  }
};

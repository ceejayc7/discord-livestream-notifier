import { BOT_COMMANDS, TWITTER_CHARACTER_LIMIT } from '@root/constants';

import _ from 'lodash';
import { sendMessageToChannel } from '@root/util';

const CONSTANTS = require('@data/constants.json').tokens;
const Twitter = require('twitter');

export let client;

if (CONSTANTS?.twitter) {
  // Twitter client
  client = new Twitter({
    consumer_key: CONSTANTS?.twitter?.consumerKey,
    consumer_secret: CONSTANTS?.twitter?.consumerSecret,
    access_token_key: CONSTANTS?.twitter?.accessTokenKey,
    access_token_secret: CONSTANTS?.twitter?.accessTokenSecret
  });
} else {
  client = null;
}

const getUsernameFromTweetId = (tweetId) => {
  return new Promise((resolve, reject) => {
    client.get(`statuses/show/${tweetId}`, (error, data) => {
      if (error) {
        reject(error);
      }
      resolve(data?.user?.screen_name); // eslint-disable-line
    });
  });
};

export const retweet = (msg) => {
  if (!client) {
    return Promise.resolve();
  }

  const tweetId = msg.content.replace(BOT_COMMANDS.RETWEET.command, '').trim();
  console.log(`[Twitter]: Retweeting ${tweetId}`);

  client.post(`statuses/retweet/${tweetId}`, (error, data) => {
    if (error) {
      sendMessageToChannel(msg, `Couldn't retweet bro`);
    } else {
      const handle = data?.user?.screen_name; // eslint-disable-line
      const tweetId = data?.id_str; // eslint-disable-line
      sendMessageToChannel(msg, `https://twitter.com/${handle}/status/${tweetId}`);
    }
  });
};

export const sendReply = async (msg) => {
  if (!client) {
    return Promise.resolve();
  }

  const split = msg.content.split(' ');

  if (split.length < 3 || _.first(split) !== BOT_COMMANDS.TWEET_REPLY.command) {
    sendMessageToChannel(msg, `Usage: !reply {tweet id} {message}`);
    return;
  }

  const tweetId = split[1];

  try {
    const username = await getUsernameFromTweetId(tweetId);
    const msgString = _.slice(split, 2).join(' ');
    const status = `@${username} ${msgString}`;
    const params = {
      status,
      in_reply_to_status_id: tweetId
    };
    postTweet(msg, params);
  } catch (error) {
    if (error[0].code === 34) {
      console.log(`[Twitter]: Twitter API Error - error: ${error[0].code} ${error[0].message}`);
      sendMessageToChannel(msg, `That's an invalid tweet bro`);
    } else {
      sendTweetError(msg, error);
    }
  }
};

const sendTweetError = (msg, error) => {
  console.log(`[Twitter]: Twitter API Error - error: ${error[0].code} ${error[0].message}`);
  sendMessageToChannel(msg, `Couldn't send tweet bro`);
};

const postTweet = (msg, params) => {
  console.log(`[Twitter]: Tweeting ${params.status}`);
  client.post('statuses/update', params, (error, tweets) => {
    if (error) {
      sendTweetError(msg, error);
    } else {
      const handle = tweets?.user?.screen_name; // eslint-disable-line
      const tweetId = tweets?.id_str; // eslint-disable-line
      sendMessageToChannel(msg, `https://twitter.com/${handle}/status/${tweetId}`);
    }
  });
};

export const sendTweet = (msg) => {
  if (!client) {
    return Promise.resolve();
  }

  let status = msg.content.replace(BOT_COMMANDS.TWEET.command, '');
  status = _.take(status, TWITTER_CHARACTER_LIMIT).join('');
  const params = {
    status
  };

  postTweet(msg, params);
};

const handleError = (error, reject) => {
  console.log('[Twitter]: Twitter API Error');
  console.log(JSON.stringify(error));
  return reject(Error());
};

export const getPinnedTweet = async (handle) => {
  if (!client) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    client.get(
      `https://api.twitter.com/labs/2/users/by?usernames=${handle}&user.fields=pinned_tweet_id`,
      (error, user) => {
        if (error) {
          return handleError(error, reject);
        }
        const pinnedTweetId = user?.data[0]?.pinned_tweet_id; // eslint-disable-line
        if (pinnedTweetId) {
          return resolve(`https://twitter.com/${handle}/status/${pinnedTweetId}`);
        } else {
          resolve();
        }
      }
    );
  });
};

export const getTimeline = async (username) => {
  if (!client) {
    return Promise.resolve();
  }

  const params = {
    screen_name: username,
    include_rts: false,
    exclude_replies: true,
    tweet_mode: 'extended',
    count: 100
  };

  return new Promise((resolve, reject) => {
    client.get('//statuses/user_timeline', params, (error, tweets) => {
      if (error) {
        return handleError(error, reject);
      }

      return resolve(tweets);
    });
  });
};

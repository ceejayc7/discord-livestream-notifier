import { BOT_COMMANDS, TWITTER_CHARACTER_LIMIT } from '@root/constants';

import _ from 'lodash';
import moment from 'moment-timezone';
import { sendMessageToChannel } from '@root/util';

const CONSTANTS = require('@data/constants.json').tokens;
const Twitter = require('twitter');

// Identifiers
const SKPB_TWITTER_HANDLE = 'skpblive';
const LINK_TO_TWEET = `https://twitter.com/${SKPB_TWITTER_HANDLE}/status/`;
const TWEET_TEXT_TO_CHECK_FOR = '[LIVE]';

// Datetime
const DATETIME_FORMAT_FROM_TWEET = 'MMM DD, YYYY HH:mm A';
const TIME_FORMAT_TO_STORE = 'h:mm A';
const DATE_FORMAT_TO_STORE = 'MMMM DD, YYYY';
const TWEET_TIMEZONE = 'Asia/Seoul';
const VALID_TIME_OFFSET = 7200;

// Regex
const DATE_REGEX = /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2}\,\s+\d{4}/; // eslint-disable-line
const TIME_REGEX = /(0[0-9]|1[0-9]|2[0-3]|[0-9]):([0-5][0-9])(AM|PM)\s+KST/;
const SHOWNAME_REGEX = /(\[LIVE\])\s(.+?)$/m;

let client;

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

const parseDateTimeFromTweetText = (text) => {
  const dateRegexString = text.match(DATE_REGEX);
  const timeRegexString = text.match(TIME_REGEX);
  if (dateRegexString && dateRegexString.length && timeRegexString && timeRegexString.length) {
    const datetime = `${dateRegexString[0]} ${timeRegexString[1]}:${timeRegexString[2]} ${timeRegexString[3]}`;
    const momentDatetime = moment.tz(datetime, DATETIME_FORMAT_FROM_TWEET, TWEET_TIMEZONE);

    const datetimes = {
      pst: {
        time: momentDatetime.tz('America/Los_Angeles').format(TIME_FORMAT_TO_STORE),
        date: momentDatetime.tz('America/Los_Angeles').format(DATE_FORMAT_TO_STORE)
      },
      est: {
        time: momentDatetime.tz('America/New_York').format(TIME_FORMAT_TO_STORE),
        date: momentDatetime.tz('America/New_York').format(DATE_FORMAT_TO_STORE)
      },
      unix: momentDatetime.tz('America/Los_Angeles').unix()
    };

    return datetimes;
  }
  console.log(`[Twitter]: Unable to parse tweet for time. Text: ${text}`);
  return null;
};

const getShowname = (text) => {
  const shownameRegex = text.match(SHOWNAME_REGEX);
  if (shownameRegex && shownameRegex.length > 2) {
    return shownameRegex[2];
  }
  return '';
};

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

export const getSkpbTimeline = async () => {
  if (!client) {
    return Promise.resolve();
  }

  const params = {
    screen_name: 'skpblive',
    include_rts: false,
    exclude_replies: true,
    tweet_mode: 'extended'
  };

  return new Promise((resolve, reject) => {
    client.get('statuses/user_timeline', params, (error, tweets) => {
      if (error) {
        return handleError(error, reject);
      }
      const filteredTweets = [];

      for (const tweet of tweets) {
        const text = _.get(tweet, 'full_text', '');
        if (_.includes(text, TWEET_TEXT_TO_CHECK_FOR)) {
          const time = parseDateTimeFromTweetText(text);
          const idStr = _.get(tweet, 'id_str', '');
          const showName = getShowname(text);

          filteredTweets.push({
            text,
            time,
            id: idStr,
            showName,
            link: `${LINK_TO_TWEET}${idStr}`
          });
        }
      }
      return resolve(filterForValidEvents(filteredTweets));
    });
  });
};

const filterForValidEvents = (tweets) => {
  return _.filter(tweets, isEventInFuture);
};

const isEventInFuture = (tweet) => {
  if (_.get(tweet, 'time.unix', 0) + VALID_TIME_OFFSET > moment().unix()) {
    return true;
  }
  return false;
};

export const isTwitterProtected = () => {
  if (!client) {
    return Promise.resolve();
  }
  const parameters = { screen_name: SKPB_TWITTER_HANDLE };
  return new Promise((resolve, reject) => {
    client.get('users/show', parameters, (error, userInfo) => {
      if (error) {
        return handleError(error, reject);
      }
      return resolve(userInfo?.protected);
    });
  });
};

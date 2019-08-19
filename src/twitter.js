import { TWITTER as TWITTER_CONSTANTS } from './constants';
import _ from 'lodash';
import moment from 'moment-timezone';

const Twitter = require('twitter');

// Identifiers
const TWITTER_HANDLE = 'skpblive';
const LINK_TO_TWEET = `https://twitter.com/${TWITTER_HANDLE}/status/`;
const TWEET_TEXT_TO_CHECK_FOR = '[LIVE]';

// Datetime
const DATETIME_FORMAT_FROM_TWEET = 'MMM DD, YYYY HH:mm A';
const TIME_FORMAT_TO_STORE = 'h:mm A';
const DATE_FORMAT_TO_STORE = 'MMMM DD, YYYY';
const TWEET_TIMEZONE = 'Asia/Seoul';
const VALID_TIME_OFFSET = 7200;

// Regex
const DATE_REGEX = /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2}\,\s+\d{4}/;
const TIME_REGEX = /(0[0-9]|1[0-9]|2[0-3]|[0-9]):([0-5][0-9])(AM|PM)\s+KST/;
const SHOWNAME_REGEX = /(\[LIVE\])\s(.+?)$/m;

let client;

if (
  TWITTER_CONSTANTS &&
  TWITTER_CONSTANTS.consumer_key &&
  TWITTER_CONSTANTS.consumer_secret &&
  TWITTER_CONSTANTS.access_token_key &&
  TWITTER_CONSTANTS.access_token_secret
) {
  // Twitter client
  client = new Twitter({
    consumer_key: TWITTER_CONSTANTS.consumer_key,
    consumer_secret: TWITTER_CONSTANTS.consumer_secret,
    access_token_key: TWITTER_CONSTANTS.access_token_key,
    access_token_secret: TWITTER_CONSTANTS.access_token_secret
  });
} else {
  client = null;
}

const params = {
  screen_name: TWITTER_HANDLE,
  include_rts: false,
  exclude_replies: true,
  tweet_mode: 'extended'
};

function parseDateTimeFromTweetText(text) {
  const dateRegexString = text.match(DATE_REGEX);
  const timeRegexString = text.match(TIME_REGEX);
  if (dateRegexString && dateRegexString.length && timeRegexString && timeRegexString.length) {
    const datetime = `${dateRegexString[0]} ${timeRegexString[1]}:${timeRegexString[2]} ${
      timeRegexString[3]
    }`;
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
}

function getShowname(text) {
  const shownameRegex = text.match(SHOWNAME_REGEX);
  if (shownameRegex && shownameRegex.length > 2) {
    return shownameRegex[2];
  }
  return '';
}

export function getLatestTweets() {
  if (!client) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    client.get('statuses/user_timeline', params, (error, tweets) => {
      if (error) {
        console.log(
          `[Twitter]: Twitter API Error - message: ${error[0].message} - code: ${error[0].code}`
        );
        return reject(Error());
      }
      const filteredTweets = [];

      _.forEach(tweets, (tweet) => {
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
      });
      return resolve(filteredTweets);
    });
  });
}

export function isEventInFuture(tweet) {
  if (_.get(tweet, 'time.unix', 0) + VALID_TIME_OFFSET > moment().unix()) {
    return true;
  }
  return false;
}

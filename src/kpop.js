import { getPinnedTweet, getTimeline } from '@root/twitter';

import { IPTV } from '@root/iptv';
import _ from 'lodash';
import moment from 'moment-timezone';
import { sendMessageToChannel } from '@root/util';

const TIME_FORMAT = 'dddd h:mmA';
const TIMEZONE = 'Asia/Seoul';
const TEAMAQ_TWITTER_HANDLE = 'AQ_Updates';

const pinnedTweet = async (events) => await getKpopTweet(events);

export const KPOP_SCHEDULE = [
  {
    day: 'Tuesday',
    show: 'The Show',
    channel: ['SBS MTV', 'SBS F!L'],
    time: () => getRelativeTimeStart('Tuesday 6:00PM'),
    sendIPTV: true,
    pinnedTweet
  },
  {
    day: 'Wednesday',
    show: 'Show Champion',
    channel: ['MBC Music', 'MBC Every1'],
    time: () => getRelativeTimeStart('Wednesday 5:00PM'),
    sendIPTV: true,
    pinnedTweet
  },
  {
    day: 'Thursday',
    show: 'MCountdown',
    channel: ['Mnet'],
    time: () => getRelativeTimeStart('Thursday 6:00PM'),
    sendIPTV: true,
    pinnedTweet
  },
  {
    day: 'Friday',
    show: 'Music Bank',
    channel: ['KBS2'],
    time: () => getRelativeTimeStart('Friday 5:00PM'),
    sendIPTV: true,
    pinnedTweet
  },
  {
    day: 'Friday',
    show: 'Simply Kpop',
    channel: ['아리랑 TV'],
    time: () => getRelativeTimeStart('Friday 1:00PM'),
    sendIPTV: true
  },
  {
    day: 'Saturday',
    show: 'Music Core',
    channel: ['MBC'],
    time: () => getRelativeTimeStart('Saturday 3:30PM'),
    sendIPTV: true,
    pinnedTweet
  },
  {
    day: 'Sunday',
    show: 'Inkigayo',
    channel: ['SBS'],
    time: () => getRelativeTimeStart('Sunday 3:40PM'),
    sendIPTV: true,
    pinnedTweet
  }
];

const getRelativeTimeStart = (timestamp) => {
  const eventMoment = moment.tz(timestamp, TIME_FORMAT, TIMEZONE);
  const currentTime = moment.tz().unix();
  // if the event is in the future, just return the timestamp
  if (eventMoment.unix() >= currentTime) {
    return eventMoment.unix();
  }
  // if the event is from a previous weekday, add 1 week
  return eventMoment.add(1, 'weeks').unix();
};

const getTimeInKST = () => moment.tz(new Date(), 'Asia/Seoul').format('dddd h:mmA');

const parseIPTVCommand = (msg) => {
  const { content } = msg;
  const index = content.indexOf(' ');
  if (index > 0) {
    const channel = content.substring(index + 1);
    sendMessageToChannel(msg, `Generating streams for ${channel}...`);
    IPTV.getValidIPTVStreamsFromList(channel)
      .then((listOfStreams) => IPTV.createMessageToSend(listOfStreams, null, channel, null))
      .then((streams) => sendMessageToChannel(msg, streams));
  } else {
    sendMessageToChannel(msg, `Usage: !iptv (channel name)`);
  }
};

const getMusicShowsForToday = () => {
  const today = moment.tz(TIMEZONE).format('dddd');
  return KPOP_SCHEDULE.filter((event) => event.day === today);
};

const filterForValidSchedule = (tweets, events) => {
  /* eslint-disable camelcase */
  const schedule = events.map((event) => {
    const musicShow = event.show.toLowerCase();
    return tweets.map((tweet) => {
      const createdTime = moment(tweet?.created_at, 'dd MMM DD HH:mm:ss ZZ YYYY', 'en');
      const limit = moment(new Date()).subtract(5, 'days');
      const tweetText = tweet?.full_text.toLowerCase();
      if (
        tweet?.entities?.media &&
        tweetText.includes(musicShow) &&
        tweetText.includes('schedule') &&
        createdTime.isAfter(limit)
      ) {
        return `https://twitter.com/${TEAMAQ_TWITTER_HANDLE}/status/${tweet.id_str}`;
      }
    });
  });
  return _.compact(_.flatten(schedule));
};

const getKpopTweet = async (events = getMusicShowsForToday()) => {
  const teamAQTweetLink = await getPinnedTweet(TEAMAQ_TWITTER_HANDLE);
  const timeline = await getTimeline(TEAMAQ_TWITTER_HANDLE);
  const tweets = filterForValidSchedule(timeline, events);

  if (!_.isEmpty(tweets)) {
    return tweets;
  } else if (!_.isEmpty(teamAQTweetLink)) {
    return teamAQTweetLink;
  } else {
    return 'kpop is dead';
  }
};

const onKpopCommand = async (msg) => {
  const tweets = await getKpopTweet();
  sendMessageToChannel(msg, tweets);
};

export const Kpop = {
  parseIPTVCommand,
  onKpopCommand,
  getTimeInKST
};

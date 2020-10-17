import { getPinnedTweet, getTimeline } from '@root/twitter';

import { IPTV } from '@root/iptv';
import _ from 'lodash';
import moment from 'moment-timezone';
import { sendMessageToChannel } from '@root/util';

const TIME_FORMAT = 'dddd h:mmA';
const TIMEZONE = 'Asia/Seoul';
const TEAMAQ_TWITTER_HANDLE = 'AQ_Updates';

const pinnedTweet = async () => await getKpopTweet();

export const KPOP_SCHEDULE = [
  {
    day: 'Tuesday',
    show: 'The Show',
    channel: ['SBS MTV'],
    time: () => getRelativeTimeStart('Tuesday 6:00PM'),
    pinnedTweet
  },
  {
    day: 'Wednesday',
    show: 'Show Champion',
    channel: ['MBC Music', 'MBC Every1'],
    time: () => getRelativeTimeStart('Wednesday 6:00PM'),
    pinnedTweet
  },
  {
    day: 'Thursday',
    show: 'M Countdown',
    channel: ['Mnet'],
    time: () => getRelativeTimeStart('Thursday 6:00PM'),
    pinnedTweet
  },
  {
    day: 'Friday',
    show: 'Music Bank',
    channel: ['KBS2'],
    time: () => getRelativeTimeStart('Friday 5:00PM'),
    pinnedTweet
  },
  {
    day: 'Friday',
    show: 'Simply Kpop',
    channel: ['아리랑 TV'],
    time: () => getRelativeTimeStart('Saturday 1:00PM')
  },
  {
    day: 'Saturday',
    show: 'Music Core',
    channel: ['MBC'],
    time: () => getRelativeTimeStart('Saturday 3:30PM'),
    pinnedTweet
  },
  {
    day: 'Sunday',
    show: 'Inkigayo',
    channel: ['SBS'],
    time: () => getRelativeTimeStart('Sunday 3:50PM'),
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
  const today = moment.tz(moment.tz().unix(), 'dddd h:mmA', 'Asia/Seoul').format('dddd');
  return KPOP_SCHEDULE.filter((event) => event.day === today);
}

const filterForValidSchedule = (tweets) => {
  const events = getMusicShowsForToday();
  const mediaTweets = tweets.filter((tweet) => tweet?.entities?.media);
  return events.map((event) => {
    const musicShow = event.show.toLowerCase();
    const schedule = mediaTweets.filter((tweet) => tweet.full_text.toLowerCase().includes(musicShow) && tweet.full_text.toLowerCase().includes('schedule'));
    return schedule.map((event) => `https://twitter.com/${TEAMAQ_TWITTER_HANDLE}/status/${event.id_str}`);
  }).flat();
}

const getKpopTweet = async () => {
  const teamAQTweetLink = await getPinnedTweet(TEAMAQ_TWITTER_HANDLE);
  const timeline = await getTimeline(TEAMAQ_TWITTER_HANDLE);
  const tweets = filterForValidSchedule(timeline);

  if (!_.isEmpty(tweets)) {
    return tweets;
  } else if (!_.isEmpty(teamAQTweetLink)) {
    return teamAQTweetLink;
  } else {
    return 'kpop is dead';
  }
}

const onKpopCommand = async (msg) => {
  const tweets = await getKpopTweet();
  if(_.isArray(tweets) && !_.isEmpty(tweets)) {
    for(const tweet of tweets) {
      sendMessageToChannel(msg, tweet);
    }
  } else {
    sendMessageToChannel(msg, tweets);
  }
};

export const Kpop = {
  parseIPTVCommand,
  onKpopCommand,
  getTimeInKST
};

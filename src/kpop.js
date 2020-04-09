import { decodeHTMLEntities, sendMessageToChannel } from '@root/util';
import { getAQPinnedTweet, getSkpbTimeline, isTwitterProtected } from '@root/twitter';

import { IPTV } from '@root/iptv';
import _ from 'lodash';
import moment from 'moment-timezone';

const TIME_FORMAT = 'dddd h:mmA';
const TIMEZONE = 'Asia/Seoul';

export const KPOP_SCHEDULE = [
  {
    day: 'Tuesday',
    show: 'The Show',
    channel: ['SBS MTV', 'SBS F!L UHD'],
    time: () => getRelativeTimeStart('Tuesday 6:00PM'),
  },
  {
    day: 'Wednesday',
    show: 'Show Champion',
    channel: ['MBC Music', 'MBC Every1'],
    time: () => getRelativeTimeStart('Wednesday 6:00PM'),
  },
  {
    day: 'Thursday',
    show: 'M Countdown',
    channel: ['Mnet'],
    time: () => getRelativeTimeStart('Thursday 6:00PM'),
  },
  {
    day: 'Friday',
    show: 'Simply Kpop',
    channel: ['아리랑 TV'],
    time: () => getRelativeTimeStart('Friday 1:00PM'),
  },
  {
    day: 'Friday',
    show: 'Music Bank',
    channel: ['KBS2'],
    time: () => getRelativeTimeStart('Friday 5:00PM'),
  },
  {
    day: 'Saturday',
    show: 'Music Core',
    channel: ['MBC'],
    time: () => getRelativeTimeStart('Saturday 3:30PM'),
  },
  {
    day: 'Sunday',
    show: 'Inkigayo',
    channel: ['SBS'],
    time: () => getRelativeTimeStart('Sunday 3:50PM'),
  },
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

const sendEmptyKpopMsg = (msg) => sendMessageToChannel(msg, `kpop is dead`);

const printSkpbKpopMessage = async (msg, tweets) => {
  if (_.isEmpty(tweets)) {
    sendEmptyKpopMsg(msg);
  }
  const isProtected = await isTwitterProtected();
  for (const tweet of tweets) {
    sendMessageToChannel(
      msg,
      `${tweet.showName}\n> PST: **${tweet.time.pst.time}** on ${tweet.time.pst.date}\n> EST: **${
        tweet.time.est.time
      }** on ${tweet.time.est.date}\n${
        isProtected ? '```' + decodeHTMLEntities(tweet.text) + '```' : tweet.link
      }`
    );
  }
};

const parseIPTVCommand = (msg) => {
  const { content } = msg;
  const index = content.indexOf(' ');
  if (index > 0) {
    const channel = content.substring(index + 1);
    sendMessageToChannel(msg, `Generating streams for ${channel}...`);
    IPTV.getValidIPTVStreamsFromList(channel)
      .then(IPTV.createMessageToSend)
      .then((streams) => sendMessageToChannel(msg, streams));
  } else {
    sendMessageToChannel(msg, `Usage: !iptv (channel name)`);
  }
};

const onKpopCommand = async (msg) => {
  const skpbTimeline = await getSkpbTimeline();
  const teamAQTweetLink = await getAQPinnedTweet();
  if (!_.isEmpty(skpbTimeline)) {
    printSkpbKpopMessage(msg, skpbTimeline);
  } else if (teamAQTweetLink) {
    sendMessageToChannel(msg, teamAQTweetLink);
  } else {
    sendEmptyKpopMsg(msg);
  }
};

export const Kpop = {
  parseIPTVCommand,
  onKpopCommand,
};

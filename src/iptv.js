import cheerio from 'cheerio';
import request from 'request';
import rq from 'request-promise';
import _ from 'lodash';
import moment from 'moment-timezone';
import { Helpers } from './helpers';
const path = require('path');

const TIME_FORMAT = 'dddd h:mmA';
const TIMEZONE = 'Asia/Seoul';

function getRelativeTimeStart(timestamp) {
  const eventMoment = moment.tz(timestamp, TIME_FORMAT, TIMEZONE);
  const currentTime = moment.tz().unix();
  // if the event is in the future, just return the timestamp
  if (eventMoment.unix() >= currentTime) {
    return eventMoment.unix();
  }
  // if the event is from a previous weekday, add 1 week
  return eventMoment.add(1, 'weeks').unix();
}

export const kpopSchedule = [
  {
    day: 'Tuesday',
    show: 'The Show',
    channel: ['SBS MTV', 'SBS F!L UHD'],
    time: () => getRelativeTimeStart('Tuesday 6:00PM')
  },
  {
    day: 'Wednesday',
    show: 'Show Champion',
    channel: ['MBC Music', 'MBC Every1'],
    time: () => getRelativeTimeStart('Wednesday 6:00PM')
  },
  {
    day: 'Thursday',
    show: 'M Countdown',
    channel: ['Mnet'],
    time: () => getRelativeTimeStart('Thursday 6:00PM')
  },
  {
    day: 'Friday',
    show: 'Simply Kpop',
    channel: ['아리랑 TV'],
    time: () => getRelativeTimeStart('Friday 1:00PM')
  },
  {
    day: 'Friday',
    show: 'Music Bank',
    channel: ['KBS2'],
    time: () => getRelativeTimeStart('Friday 5:00PM')
  },
  {
    day: 'Saturday',
    show: 'Music Core',
    channel: ['MBC'],
    time: () => getRelativeTimeStart('Saturday 3:30PM')
  },
  {
    day: 'Sunday',
    show: 'Inkigayo',
    channel: ['SBS'],
    time: () => getRelativeTimeStart('Sunday 3:50PM')
  }
];

const iptvDatabase = {
  'SBS MTV': 'iptv/sbsmtv.txt',
  'SBS F!L UHD': 'iptv/sbsfil.txt',
  'MBC Music': 'iptv/mbcmusic.txt',
  'MBC Every1': 'iptv/mbcevery1.txt',
  Mnet: 'iptv/mnet.txt',
  '아리랑 TV': 'iptv/arirang_hd.txt',
  KBS2: 'iptv/kbs2.txt',
  MBC: 'iptv/mbc.txt',
  SBS: 'iptv/sbs.txt',
  'SBS Fun E': 'iptv/sbsfune.txt',
  'SBS Plus': 'iptv/sbsplus.txt'
};

const KOREAN_BLOG_LINKS_TO_QUERY_FOR = [];

// initialize blog array
for (let page = 1; page <= 15; page++) {
  KOREAN_BLOG_LINKS_TO_QUERY_FOR.push(`https://www.extinf.com/category/korean/page/${page}/`);
}

const IPTV_TIMEOUT_MS = 10000;

function isValidIPTVStream(link) {
  return new Promise((resolve) => {
    const req = request({ url: link, timeout: IPTV_TIMEOUT_MS })
      .on('response', (response) => {
        req.abort();
        if (response.statusCode === 200 && _.includes(response.headers['content-type'], 'video')) {
          resolve(true);
        }
        resolve(false);
      })
      .on('error', () => resolve(false));
  });
}

async function findValidStreams(pages, channelName) {
  const validStreams = [];
  const PLAYLIST_REGEX_STRING = `(#EXTINF:-1,${channelName})\\s(http:\\/\\/\\S+)`;
  const PLAYLIST_REGEX = new RegExp(PLAYLIST_REGEX_STRING, 'gi');
  for (const $ of pages) {
    const playlist = $('.entry-content p').text();
    const match = PLAYLIST_REGEX.exec(playlist);
    if (match && match.length) {
      const potentialValidStream = match[2];
      const isValidStream = await isValidIPTVStream(potentialValidStream).catch((error) =>
        console.log(`[IPTV]: error finding valid streams. ${error}`)
      );
      if (isValidStream) {
        validStreams.push({
          channel: match[1],
          stream: match[2]
        });
      }
    }
  }
  return validStreams;
}

function getAllPageData(pages) {
  const promises = [];
  pages.forEach((page) => {
    const httpOptions = {
      url: page,
      transform: function(body) {
        return cheerio.load(body);
      }
    };
    promises.push(rq(httpOptions));
  });
  return Promise.all(promises);
}

function scrapePageForLinks($) {
  const pages = [];
  if ($('#mas-wrapper').length) {
    $('#mas-wrapper > article').each(function() {
      pages.push(
        $(this)
          .find('a')
          .first()
          .attr('href')
      );
    });
  } else {
    console.log(`[IPTV]: Unable to scrape page`);
  }
  return pages;
}

function getValidIPTVStreamsFromPage(linkToPage, channelName) {
  const httpOptions = {
    url: linkToPage,
    transform: function(body) {
      return cheerio.load(body);
    }
  };

  return rq(httpOptions)
    .then(scrapePageForLinks)
    .then(getAllPageData)
    .then((data) => findValidStreams(data, channelName))
    .catch((error) => console.log(`[IPTV]: Error when retrieving IPTV streams. ${error}`));
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const processOfflineStreams = async (lines, channel) => {
  const promises = [];
  const results = [];

  // test each stream asyncronously
  for (const line of lines) {
    promises.push(isValidIPTVStream(line));
  }

  // execute all promises
  const boolResults = await Promise.all(promises);

  // if the promise returned true, index the original lines array to find the ip
  for (const [index, value] of boolResults.entries()) {
    if (value) {
      results.push({
        channel: `#EXTINF:-1,${channel}`,
        stream: lines[index]
      });
    }
  }

  return results;
};

const getStreamsFromOfflineDB = (channelName) => {
  const key = Helpers.getCaseInsensitiveKey(iptvDatabase, channelName);
  if (key) {
    const pathToFile = path.resolve(`${__dirname}/${iptvDatabase[key]}`);
    return require('fs')
      .readFileSync(pathToFile, 'utf-8')
      .split(/\r?\n/);
  }
  return [];
};

const getValidOfflineDBStreams = async (channelName) => {
  const lines = getStreamsFromOfflineDB(channelName);
  return await processOfflineStreams(lines, channelName);
};

export const getValidIPTVStreamsFromList = async (channelName) => {
  const promises = [];
  const TIMEOUT = 1500;
  let iter = 0;
  for (const page of KOREAN_BLOG_LINKS_TO_QUERY_FOR) {
    // add a delay on each promise so we don't spam out the endpoint
    promises.push(wait(TIMEOUT * iter).then(() => getValidIPTVStreamsFromPage(page, channelName)));
    iter++;
  }
  promises.push(getValidOfflineDBStreams(channelName));
  return Promise.all(promises)
    .then(_.flatten)
    .then((data) => _.take(_.uniqBy(data, 'stream'), 11));
};

export function createMessageToSend(listOfStreams, showName, channelName) {
  if (listOfStreams && listOfStreams.length) {
    let messageToSend = `>>> Generated IPTV streams`;
    if (showName && channelName) {
      messageToSend += ` for **${showName}** on **${channelName}**`;
    }
    messageToSend += '```diff\n';
    for (const stream of listOfStreams) {
      messageToSend += `+  ${stream.stream}\n`;
    }
    messageToSend += '```';
    return messageToSend;
  } else {
    if (showName && channelName) {
      return `No streams found for **${showName}** on **${channelName}**`;
    }
    return `No streams found`;
  }
}

export async function sendIPTVStreams(event, channelToSendTo) {
  for (const channel of event.channel) {
    try {
      const streams = await getValidIPTVStreamsFromList(channel);
      const messageToSend = createMessageToSend(streams, event.show, channel);
      console.log(`[IPTV] Sending ${event.show} on ${channel}`);
      channelToSendTo.send(messageToSend);
    } catch (error) {
      console.log(`Error retriving IPTV streams. ${error}`);
    }
  }
}

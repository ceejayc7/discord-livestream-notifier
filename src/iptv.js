import { getCaseInsensitiveKey, wait } from '@root/util';

import { IPTV_DATABASE } from '@root/constants';
import _ from 'lodash';
import cheerio from 'cheerio';
import request from 'request';
import rq from 'request-promise';

const path = require('path');

const IPTV_TIMEOUT_MS = 10000;
const KOREAN_BLOG_LINKS_TO_QUERY_FOR = [];

const generateEndpoints = () => {
  // initialize blog array
  for (let page = 1; page <= 4; page++) {
    KOREAN_BLOG_LINKS_TO_QUERY_FOR.push(`https://www.extinf.com/category/korean/page/${page}/`);
  }
};

const isValidIPTVStream = (link) => {
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
};

const findValidStreams = async (pages, channelName) => {
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
};

const getAllPageData = (pages) => {
  const promises = [];
  pages.forEach((page) => {
    const httpOptions = {
      url: page,
      transform: function (body) {
        return cheerio.load(body);
      }
    };
    promises.push(rq(httpOptions));
  });
  return Promise.all(promises);
};

const scrapePageForLinks = ($) => {
  const pages = [];
  if ($('#mas-wrapper').length) {
    $('#mas-wrapper > article').each(function () {
      pages.push($(this).find('a').first().attr('href'));
    });
  } else {
    console.log(`[IPTV]: Unable to scrape page`);
  }
  return pages;
};

const getValidIPTVStreamsFromPage = (linkToPage, channelName) => {
  const httpOptions = {
    url: linkToPage,
    transform: function (body) {
      return cheerio.load(body);
    }
  };

  return rq(httpOptions)
    .then(scrapePageForLinks)
    .then(getAllPageData)
    .then((data) => findValidStreams(data, channelName))
    .catch((error) => {
      console.log(`[IPTV]: Error when retrieving IPTV streams. ${error}`);
      return [];
    });
};

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
  const key = getCaseInsensitiveKey(IPTV_DATABASE, channelName);
  if (key) {
    const pathToFile = path.resolve(`${__dirname}/iptv/${IPTV_DATABASE[key]}`);
    return require('fs').readFileSync(pathToFile, 'utf-8').split(/\r?\n/);
  }
  return [];
};

const getValidOfflineDBStreams = async (channelName) => {
  const lines = getStreamsFromOfflineDB(channelName);
  return await processOfflineStreams(lines, channelName);
};

const getValidIPTVStreamsFromList = async (channelName) => {
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

const createMessageToSend = (listOfStreams, showName, channelName) => {
  if (listOfStreams && listOfStreams.length) {
    let messageToSend = `>>> IPTV streams`;
    if (showName) {
      messageToSend += ` for **${showName}**`;
    }
    messageToSend += ` on **${channelName}**`;
    messageToSend += '```fix\n';
    for (const stream of listOfStreams) {
      messageToSend += `${stream.stream}\n\n`;
    }
    messageToSend += '```';
    return messageToSend;
  } else {
    if (showName && channelName) {
      return `No streams found for **${showName}** on **${channelName}**`;
    }
    return `No streams found`;
  }
};

const sendIPTVStreams = async (event, discordChannels) => {
  for (const channel of event.channel) {
    try {
      const streams = await getValidIPTVStreamsFromList(channel);
      const messageToSend = createMessageToSend(streams, event.show, channel);
      let tweet = '';
      if (event?.pinnedTweet) {
        tweet = await event.pinnedTweet();
      }
      console.log(`[IPTV] Sending ${event.show} on ${channel}`);
      for (const discordChannel of discordChannels) {
        if (tweet) {
          discordChannel.send(tweet);
        }
        discordChannel.send(messageToSend);
      }
    } catch (error) {
      console.log(`Error retriving IPTV streams. ${error}`);
    }
  }
};

generateEndpoints();

export const IPTV = {
  sendIPTVStreams,
  createMessageToSend,
  getValidIPTVStreamsFromList
};

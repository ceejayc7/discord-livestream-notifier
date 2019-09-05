import cheerio from 'cheerio';
import request from 'request';
import rq from 'request-promise';
import _ from 'lodash';
import moment from 'moment-timezone';

const kpopSchedule = [
  {
    day: 'Tuesday',
    show: 'The Show',
    channel: ['SBS MTV', 'SBS Fun E', 'SBS Plus']
  },
  {
    day: 'Wednesday',
    show: 'Show Champion',
    channel: ['MBC Music', 'MBC Every1']
  },
  {
    day: 'Thursday',
    show: 'M Countdown',
    channel: ['Mnet']
  },
  {
    day: 'Friday',
    show: 'Music Bank',
    channel: ['KBS2']
  },
  {
    day: 'Saturday',
    show: 'Music Core',
    channel: ['MBC']
  },
  {
    day: 'Sunday',
    show: 'Inkigayo',
    channel: ['SBS']
  }
];

const KOREAN_BLOG_LINKS_TO_QUERY_FOR = [
  'https://www.extinf.com/category/korean/page/1/',
  'https://www.extinf.com/category/korean/page/2/',
  'https://www.extinf.com/category/korean/page/3/',
  'https://www.extinf.com/category/korean/page/4/',
  'https://www.extinf.com/category/korean/page/5/',
  'https://www.extinf.com/category/korean/page/6/'
];
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

export function getValidIPTVStreamsFromList(channelName) {
  const promises = [];
  for (const page of KOREAN_BLOG_LINKS_TO_QUERY_FOR) {
    promises.push(getValidIPTVStreamsFromPage(page, channelName));
  }
  return Promise.all(promises)
    .then(_.flatten)
    .then((data) => _.uniqBy(data, 'stream'));
}

export function generateEventFromDayOfWeek() {
  const dayOfWeek = moment.tz('Asia/Seoul').format('dddd');
  return _.first(_.filter(kpopSchedule, (event) => event.day === dayOfWeek));
}

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

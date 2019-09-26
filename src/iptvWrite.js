import cheerio from 'cheerio';
import request from 'request';
import rq from 'request-promise';
import _ from 'lodash';
import moment from 'moment-timezone';
const fs = require('fs');

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

const channelHeaders = {
  sbs:
    '#EXTINF:-1 tvg-logo="https://iptv.live/images/logo/channel/thumbs/c3cb8a08cd526b96ae0f7f24a7cf65cb.png", SBS',
  mbc:
    '#EXTINF:-1 tvg-logo="https://iptv.live/images/logo/channel/crops/9d7fe60f25abdf582afc7cdca238bde8.png", MBC',
  kbs2:
    '#EXTINF:-1 tvg-logo="https://iptv.live/images/logo/channel/crops/8c363622bbbae4b99b777a3555b05b77.png", KBS2',
  mnet:
    '#EXTINF:-1 tvg-logo="https://iptv.live/images/logo/channel/crops/2b351bbc06a1506a8777cc8c66518540.png", Mnet',
  sbsmtv:
    '#EXTINF:-1 tvg-logo="https://iptv.live/images/logo/channel/crops/6af1cc723552a04660ae92c5dab789d1.png", SBS MTV',
  sbsfune:
    '#EXTINF:-1 tvg-logo="https://iptv.live/images/logo/channel/crops/c25e97f8d30968a017052a16ec71b0c5.png", SBS Fun E',
  sbsplus:
    '#EXTINF:-1 tvg-logo="https://iptv.live/images/logo/channel/crops/2af0944ec6f765253880a3c1e5d89beb.png", SBS Plus',
  mbcmusic:
    '#EXTINF:-1 tvg-logo="https://iptv.live/images/logo/channel/crops/a7d009be9219c37b89434d2a2554e97e.png", MBC MUSIC'
};

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

function getValidIPTVStreamsFromList(channelName) {
  const promises = [];
  for (const page of KOREAN_BLOG_LINKS_TO_QUERY_FOR) {
    promises.push(getValidIPTVStreamsFromPage(page, channelName));
  }
  return Promise.all(promises)
    .then(_.flatten)
    .then((data) => _.uniqBy(data, 'stream'));
}

function getChannelsForCurrentDay() {
  const day = moment.tz('Asia/Seoul').format('dddd');
  return _.filter(kpopSchedule, (event) => event.day === day);
}

function createNewFile(path) {
  if (!fs.existsSync(path)) {
    const header = '#EXTM3U';
    fs.writeFileSync(path, header);
  }
}

function getHeader(channel) {
  const massagedChannel = _.lowerCase(channel).replace(' ', '');
  return _.get(channelHeaders, massagedChannel);
}

async function getExtractedFileContents(path, channel) {
  const header = getHeader(channel);

  const lineReader = require('readline').createInterface({
    input: require('fs').createReadStream(path)
  });

  let deleteNextLine = false;
  let fileContents = '';

  for await (const line of lineReader) {
    if (!deleteNextLine && line !== header) {
      fileContents += line + '\n';
    }
    deleteNextLine = false;

    if (line === header) {
      deleteNextLine = true;
    }
  }
  return fileContents;
}

function getAppendedStreams(fileContents, streams, channel) {
  const header = getHeader(channel);
  streams.forEach((stream) => {
    fileContents += `${header}\n${stream.stream}\n`;
  });
  return fileContents;
}

async function run() {
  const [, , ...args] = process.argv;
  if (_.isEmpty(args)) {
    throw new Error('Need to specify path in args');
  }
  const path = args[0];

  createNewFile(path);
  const channels = _.first(getChannelsForCurrentDay()).channel;
  for await (const channel of channels) {
    let fileContents = await getExtractedFileContents(path, channel);
    const streams = await getValidIPTVStreamsFromList(channel);
    fileContents = getAppendedStreams(fileContents, streams, channel);
    fs.writeFileSync(path, fileContents);
  }
}

run();

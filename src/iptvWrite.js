import _ from 'lodash';
import { KPOP_SCHEDULE, getValidIPTVStreamsFromList } from './iptv';
import moment from 'moment-timezone';
const fs = require('fs');

const channelHeaders = {
  SBS:
    '#EXTINF:-1 tvg-logo="https://iptv.live/images/logo/channel/thumbs/c3cb8a08cd526b96ae0f7f24a7cf65cb.png", SBS',
  MBC:
    '#EXTINF:-1 tvg-logo="https://iptv.live/images/logo/channel/crops/9d7fe60f25abdf582afc7cdca238bde8.png", MBC',
  KBS2:
    '#EXTINF:-1 tvg-logo="https://iptv.live/images/logo/channel/crops/8c363622bbbae4b99b777a3555b05b77.png", KBS2',
  Mnet:
    '#EXTINF:-1 tvg-logo="https://iptv.live/images/logo/channel/crops/2b351bbc06a1506a8777cc8c66518540.png", Mnet',
  'SBS MTV':
    '#EXTINF:-1 tvg-logo="https://iptv.live/images/logo/channel/crops/6af1cc723552a04660ae92c5dab789d1.png", SBS MTV',
  'SBS Fun E':
    '#EXTINF:-1 tvg-logo="https://iptv.live/images/logo/channel/crops/c25e97f8d30968a017052a16ec71b0c5.png", SBS Fun E',
  'SBS Plus':
    '#EXTINF:-1 tvg-logo="https://iptv.live/images/logo/channel/crops/2af0944ec6f765253880a3c1e5d89beb.png", SBS Plus',
  'MBC Music':
    '#EXTINF:-1 tvg-logo="https://iptv.live/images/logo/channel/crops/a7d009be9219c37b89434d2a2554e97e.png", MBC MUSIC',
  'MBC Every1':
    '#EXTINF:-1 tvg-logo="https://iptv.live/images/logo/channel/crops/acba9d6853088912a883bfe9de5480fd.png", MBC Every1',
  '아리랑 TV':
    '#EXTINF:-1 tvg-logo="https://iptv.live/images/logo/channel/crops/4ec82bee9311030da88db9f44d48592b.png", 아리랑 TV'
};

function getEventsForToday() {
  const day = moment.tz('Asia/Seoul').format('dddd');
  return _.filter(KPOP_SCHEDULE, (event) => event.day === day);
}

function createNewFile(path) {
  if (!fs.existsSync(path)) {
    const header = '#EXTM3U';
    fs.writeFileSync(path, header);
  }
}

function getHeader(channel) {
  return _.get(channelHeaders, channel, `#EXTINF:-1 ${channel}`);
}

async function getExtractedFileContents(path, header) {
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

function getAppendedStreams(fileContents, streams, header) {
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
  const events = getEventsForToday();
  for (const event of events) {
    const channels = event.channel;
    for await (const channel of channels) {
      const header = getHeader(channel);
      let fileContents = await getExtractedFileContents(path, header);
      const streams = await getValidIPTVStreamsFromList(channel);
      fileContents = getAppendedStreams(fileContents, streams, header);
      fs.writeFileSync(path, fileContents);
    }
  }
}

run();

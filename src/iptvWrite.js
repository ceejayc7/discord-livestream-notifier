import _ from 'lodash';
import { kpopSchedule, getValidIPTVStreamsFromList } from './iptv';
import moment from 'moment-timezone';
const fs = require('fs');

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
  return _.get(channelHeaders, massagedChannel, `#EXTINF:-1 ${channel}`);
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
  const channels = _.first(getChannelsForCurrentDay()).channel;
  for await (const channel of channels) {
    const header = getHeader(channel);
    let fileContents = await getExtractedFileContents(path, header);
    const streams = await getValidIPTVStreamsFromList(channel);
    fileContents = getAppendedStreams(fileContents, streams, header);
    fs.writeFileSync(path, fileContents);
  }
}

run();

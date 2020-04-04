import Livestream from '@stream/livestream';
import _ from 'lodash';
import cheerio from 'cheerio';
import request from 'request-promise';

const AFREECA_API_ENDPOINT =
  'http://afbbs.afreecatv.com:8080/api/video/get_bj_liveinfo.php?szBjId=';

class Afreeca extends Livestream {
  constructor(streamEmitter) {
    super(streamEmitter);

    this.PLATFORM = 'afreeca';
    this.multipleCalls = true;
    this.siteLogo = 'https://i.imgur.com/8tSdx8X.jpg';
    this.embedColor = 689888;
    this.BROODWAR_PLAYERS = require('@data/broodwar.json');
  }

  updateStreams = () => {
    this.getAPIDataAndAnnounce(this.getChannelPromises, null, this.multipleCalls);
  };

  getChannelPromises = (stream) => {
    const httpOptions = {
      url: AFREECA_API_ENDPOINT + stream,
      transform: (body) => {
        const $ = cheerio.load(body, { xmlMode: true });
        const isLive = $('LiveInfo result').text() === '1';

        if (isLive) {
          let preview = `https:${decodeURIComponent($('LiveInfo thumb').text())}`;
          const jpgIndex = preview.indexOf('.jpg');
          if (jpgIndex !== -1) {
            preview = preview.slice(0, jpgIndex) + '_480x270.jpg';
          }

          const name = $('LiveInfo user_id').text();
          const displayName = _.get(this.BROODWAR_PLAYERS, name, name);

          return {
            platform: this.PLATFORM,
            name: name.toLowerCase(),
            displayName,
            viewers: parseInt($('LiveInfo view_cnt').text()),
            url: $('LiveInfo url').text(),
            title: '',
            preview,
            updatedAt: new Date().toISOString()
          };
        }
      }
    };
    return request(httpOptions).catch((error) => this.apiError(this.PLATFORM, error));
  };
}

export default Afreeca;
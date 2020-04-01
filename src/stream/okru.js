import Livestream from '@stream/livestream';
import _ from 'lodash';
import cheerio from 'cheerio';
import request from 'request-promise';

const OKRU_BASE_URL = 'https://ok.ru';
const OKRU_ENDPOINT = 'https://ok.ru/live/profile/';
const PROTOCOL = 'https:';

class OkRu extends Livestream {
  constructor(streamEmitter) {
    super(streamEmitter);
    this.PLATFORM = 'okru';
    this.multipleCalls = true;
  }

  updateStreams = () => {
    this.getAPIDataAndAnnounce(this.getChannelPromises, null, this.multipleCalls);
  };

  scrapePage = ($) => {
    if ($('.video-card_live.__active').length) {
      const streamUrl = OKRU_BASE_URL + $('.video-card_img-w a').attr('href');
      const channelName = $('.compact-profile_img a')
        .attr('href')
        .match(/\d+/g)
        .map(Number)
        .toString();
      const title = $('.video-card_n-w a').attr('title');
      const channelLogo = PROTOCOL + $('.channel-panel_img-w img').attr('src');
      const preview = PROTOCOL + $('.video-card_img-w a img').attr('src');
      const displayName = $('.compact-profile_a.ellip-i').text();
      const timestamp = new Date().toISOString();

      return {
        platform: this.PLATFORM,
        name: channelName,
        displayName: displayName,
        title: title,
        logo: channelLogo,
        url: streamUrl,
        preview: preview,
        updated_at: timestamp
      };
    }
  };

  getChannelPromises = (url) => {
    const httpOptions = {
      url: OKRU_ENDPOINT + url,
      transform: function(body) {
        return cheerio.load(body);
      }
    };

    return request(httpOptions)
      .then(this.scrapePage)
      .catch((error) => this.apiError(this.PLATFORM, error));
  };
}

export default OkRu;

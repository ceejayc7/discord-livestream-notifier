import { WHITELIST_ALL_YOUTUBE_STREAMS, YOUTUBE_KEY } from '@root/constants';

import Livestream from '@stream/livestream';
import _ from 'lodash';
import request from 'request-promise';

const YOUTUBE_API_ENDPOINT = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&eventType=live&key=${YOUTUBE_KEY}&channelId=`;

class Youtube extends Livestream {
  constructor(streamEmitter) {
    super(streamEmitter);

    this.PLATFORM = 'youtube';
    this.multipleCalls = true;
    this.siteLogo = 'https://puu.sh/Bucut/9645bccf23.png';
    this.embedColor = 16711680;
  }

  updateStreams = () => {
    this.getAPIDataAndAnnounce(this.getChannelPromises, this.reduceResponse, this.multipleCalls);
  };

  getChannelPromises = (stream) => {
    const httpOptions = {
      url: YOUTUBE_API_ENDPOINT + stream,
      json: true
    };
    return request(httpOptions).catch((error) => this.apiError(this.PLATFORM, error));
  };

  reduceResponse = (response) => {
    const reducedResponse = [];
    const flattenedResponse = _.flatten(_.map(response, 'items'));
    for (const stream of flattenedResponse) {
      const title = stream?.snippet?.title;
      if (WHITELIST_ALL_YOUTUBE_STREAMS || !_.includes(title, '24/7')) {
        const url = `https://www.youtube.com/watch?v=${stream?.id?.videoId}`;
        const preview =
          stream?.snippet?.thumbnails?.high?.url + `?t=${Math.round(new Date().getTime() / 1000)}`;

        reducedResponse.push({
          platform: this.PLATFORM,
          name: stream?.snippet?.channelId,
          displayName: stream?.snippet?.channelTitle,
          preview,
          title,
          url,
          updatedAt: new Date().toISOString()
        });
      }
    }
    return reducedResponse;
  };
}

export default Youtube;

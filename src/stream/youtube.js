import { WHITELIST_ALL_YOUTUBE_STREAMS, YOUTUBE_KEY } from '@root/constants';

import Livestream from '@stream/livestream';
import _ from 'lodash';
import request from 'request-promise';

const PLATFORM = 'youtube';
const YOUTUBE_API_ENDPOINT = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&eventType=live&key=${YOUTUBE_KEY}&channelId=`;

class Youtube extends Livestream {
  constructor(streamEmitter) {
    super(streamEmitter);
  }

  getChannelPromises = (stream) => {
    const httpOptions = {
      url: YOUTUBE_API_ENDPOINT + stream,
      json: true
    };
    return request(httpOptions).catch((error) => this.apiError(PLATFORM, error));
  };

  updateStreams = () => {
    const flattenStreamsString = this.getListOfStreams(PLATFORM);
    const currentList = [];

    _.forEach(flattenStreamsString, (stream) => currentList.push(this.getChannelPromises(stream)));

    Promise.all(currentList)
      .then(this.reduceResponse)
      .then(this.retrieveLiveChannels)
      .catch((error) => this.apiError(PLATFORM, error));
  };

  reduceResponse = (response) => {
    const reducedResponse = [];
    const flattenedResponse = _.flatten(_.map(response, 'items'));
    _.forOwn(flattenedResponse, (stream) => {
      if (stream) {
        const title = _.get(stream, ['snippet', 'title']);
        if (WHITELIST_ALL_YOUTUBE_STREAMS || !_.includes(title, '24/7')) {
          const url = `https://www.youtube.com/watch?v=${_.get(stream, ['id', 'videoId'])}`;
          const preview =
            _.get(stream, ['snippet', 'thumbnails', 'high', 'url']) +
            `?t=${Math.round(new Date().getTime() / 1000)}`;
          reducedResponse.push({
            platform: PLATFORM,
            name: _.get(stream, ['snippet', 'channelId']),
            channelTitle: _.get(stream, ['snippet', 'channelTitle']),
            preview: preview,
            title,
            url: url,
            updated_at: new Date().toISOString()
          });
        }
      }
    });
    return reducedResponse;
  };
}

export default Youtube;

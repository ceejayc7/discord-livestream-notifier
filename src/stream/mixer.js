import { apiError, getListOfStreams, retrieveLiveChannels } from '@util/streamUtil';

import Livestream from '@stream/livestream';
import { MIXER_CLIENT_ID } from '@root/constants';
import _ from 'lodash';
import request from 'request-promise';

const PLATFORM = 'mixer';
const MIXER_API_ENDPOINT = 'https://mixer.com/api/v1/channels/';

class Mixer extends Livestream {
  constructor(streamEmitter) {
    super(streamEmitter);
  }

  getChannelPromises = (url) => {
    const httpOptions = {
      url: MIXER_API_ENDPOINT + url,
      json: true,
      headers: {
        'Client-ID': MIXER_CLIENT_ID,
        'content-type': 'application/json'
      }
    };
    return request(httpOptions).catch((error) => apiError(PLATFORM, error));
  };

  updateStreams = () => {
    const flattenStreamsString = getListOfStreams('mixer');
    const currentList = [];

    _.forEach(flattenStreamsString, (stream) => currentList.push(this.getChannelPromises(stream)));

    Promise.all(currentList)
      .then(this.reduceResponse)
      .then((channelData) => retrieveLiveChannels(this, channelData))
      .catch((error) => apiError(PLATFORM, error));
  };

  reduceResponse = (response) => {
    const reducedResponse = [];
    _.forOwn(response, function(stream) {
      if (stream && stream.online) {
        const url = `https://mixer.com/${_.get(stream, 'token')}`;
        reducedResponse.push({
          platform: PLATFORM,
          name: _.get(stream, 'token'),
          game: _.get(stream, ['type', 'name']),
          preview: _.get(stream, ['thumbnail', 'url']),
          viewers: _.get(stream, 'viewersCurrent'),
          title: _.get(stream, 'name'),
          logo: _.get(stream, ['user', 'avatarUrl']),
          url: url,
          updated_at: _.get(stream, 'updatedAt')
        });
      }
    });
    return reducedResponse;
  };
}

export default Mixer;

import Livestream from '@stream/livestream';
import { MIXER_CLIENT_ID } from '@root/constants';
import _ from 'lodash';
import request from 'request-promise';

const MIXER_API_ENDPOINT = 'https://mixer.com/api/v1/channels/';

class Mixer extends Livestream {
  constructor(streamEmitter) {
    super(streamEmitter);
    this.PLATFORM = 'mixer';
    this.multipleCalls = true;
  }

  updateStreams = () => {
    this.getAPIDataAndAnnounce(this.getChannelPromises, this.reduceResponse, this.multipleCalls);
  };

  getChannelPromises = (url) => {
    const httpOptions = {
      url: MIXER_API_ENDPOINT + url,
      json: true,
      headers: {
        'Client-ID': MIXER_CLIENT_ID,
        'content-type': 'application/json'
      }
    };
    return request(httpOptions).catch((error) => this.apiError(this.PLATFORM, error));
  };

  reduceResponse = (response) => {
    const reducedResponse = [];
    for (const stream of response) {
      if (stream.online) {
        const url = `https://mixer.com/${_.get(stream, 'token')}`;
        reducedResponse.push({
          platform: this.PLATFORM,
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
    }
    return reducedResponse;
  };
}

export default Mixer;

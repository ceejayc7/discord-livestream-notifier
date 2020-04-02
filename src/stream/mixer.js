import Livestream from '@stream/livestream';
import { MIXER_CLIENT_ID } from '@root/constants';
import request from 'request-promise';

const MIXER_API_ENDPOINT = 'https://mixer.com/api/v1/channels/';

class Mixer extends Livestream {
  constructor(streamEmitter) {
    super(streamEmitter);

    this.PLATFORM = 'mixer';
    this.multipleCalls = true;
    this.siteLogo = 'https://i.imgur.com/nEQjHf4.png';
    this.embedColor = 2079469;
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
        const url = `https://mixer.com/${stream?.token}`;
        reducedResponse.push({
          platform: this.PLATFORM,
          name: stream?.token.toLowerCase(),
          displayName: stream?.token,
          game: stream?.type?.name,
          preview: stream?.thumbnail?.url,
          viewers: stream?.viewersCurrent,
          title: stream?.name,
          logo: stream?.user?.avatarUrl,
          url,
          updatedAt: stream?.updatedAt
        });
      }
    }
    return reducedResponse;
  };
}

export default Mixer;

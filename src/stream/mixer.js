import Livestream from '@stream/livestream';
import request from 'request-promise';

const CONSTANTS = require('@data/constants.json').tokens;
const MIXER_API_ENDPOINT = 'https://mixer.com/api/v1/channels/';

class Mixer extends Livestream {
  constructor(sendStreamMessageToServers, silentMode) {
    super(sendStreamMessageToServers);

    this.silentMode = silentMode;
    this.PLATFORM = 'mixer';
    this.useMultipleCalls = true;
    this.useReduceResponse = true;
    this.siteLogo = 'https://i.imgur.com/nEQjHf4.png';
    this.embedColor = 2079469;
  }

  updateStreams = () => {
    this.getAPIDataAndAnnounce(this.useReduceResponse, this.useMultipleCalls);
  };

  getChannelPromises = (url) => {
    const httpOptions = {
      url: MIXER_API_ENDPOINT + url,
      json: true,
      headers: {
        'Client-ID': CONSTANTS?.mixer?.clientId,
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

import Livestream from '@stream/livestream';
import { TWENTY_MINUTES } from '@root/constants';
import _ from 'lodash';
import request from 'request-promise';

// const CONSTANTS = require('@data/constants.json').tokens;
const include24HourYouTubeStreams =
  require('@data/constants.json')?.overrides?.include24HourYouTubeStreams ?? true;
// const YOUTUBE_API_ENDPOINT = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&eventType=live&key=${CONSTANTS.youtube.apiKey}&channelId=`;
const YOUTUBE_API_ENDPOINT = `https://youtube-v31.p.rapidapi.com/search`;
const TOKENS = require('@data/constants.json')?.tokens?.instagram;

class Youtube extends Livestream {
  constructor(sendStreamMessageToServers, silentMode) {
    super(sendStreamMessageToServers);

    this.silentMode = silentMode;
    this.PLATFORM = 'youtube';
    this.useMultipleCalls = true;
    this.useReduceResponse = true;
    this.siteLogo = 'https://i.imgur.com/at2dZkI.png';
    this.embedColor = 16711680;
    this.apiRefreshInterval = TWENTY_MINUTES;
  }

  updateStreams = () => {
    this.getAPIDataAndAnnounce(this.useReduceResponse, this.useMultipleCalls).catch();
  };

  getChannelPromises = (stream) => {
    const httpOptions = {
      headers: {
        'x-rapidapi-host': 'youtube-v31.p.rapidapi.com',
        'x-rapidapi-key': `${TOKENS?.KEY}`
      },
      url: `${YOUTUBE_API_ENDPOINT}?channelId=${stream}&part=snippet,id&order=date&maxResults=100`,
      json: true
    };
    return request(httpOptions).catch((error) => this.apiError(this.PLATFORM, error));
  };

  reduceResponse = (response) => {
    const reducedResponse = [];
    const flattenedResponse = _.flatten(_.map(response, 'items'));
    const livestreams = _.filter(
      flattenedResponse,
      (stream) => stream.snippet.liveBroadcastContent === 'live'
    );
    for (const stream of livestreams) {
      const title = stream?.snippet?.title;
      if (include24HourYouTubeStreams || !_.includes(title, '24/7')) {
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

import Livestream from '@stream/livestream';
import _ from 'lodash';
import request from 'request-promise';

const BOARD_ID = '{BOARD_ID}';
const VLIVE_API_ENDPOINT = `https://www.vlive.tv/globalv-web/vam-web/post/v1.0/board-${BOARD_ID}/posts?appId=8c6cc7b45d2568fb668be6e05b6e5a3b&fields=author,officialVideo,url&sortType=LATEST&limit=20&gcc=US&locale=en_US`;

class Vlive extends Livestream {
  constructor(sendStreamMessageToServers, silentMode) {
    super(sendStreamMessageToServers);

    this.silentMode = silentMode;
    this.PLATFORM = 'vlive';
    this.useMultipleCalls = true;
    this.useReduceResponse = true;
    this.siteLogo = 'https://i.imgur.com/AaJHKAB.png';
    this.embedColor = 5568511;
  }

  updateStreams = () => {
    this.getAPIDataAndAnnounce(this.useReduceResponse, this.useMultipleCalls).catch();
  };

  getChannelPromises = (boardId) => {
    const httpOptions = {
      url: VLIVE_API_ENDPOINT.replace(BOARD_ID, boardId),
      headers: {
        Host: 'vlive.tv'
      },
      json: true
    };

    return request(httpOptions)
      .then((response) => {
        const data = _.first(
          _.filter(response.data, (stream) => stream?.officialVideo?.type === 'LIVE')
        );
        if (data) {
          data.id = boardId;
        }
        return data;
      })
      .catch((error) => this.apiError(this.PLATFORM, error));
  };

  reduceResponse = (response) => {
    const reducedResponse = [];
    for (const stream of response) {
      const timestamp = new Date(0);
      timestamp.setUTCMilliseconds(stream?.officialVideo?.onAirStartAt);

      let preview = stream?.officialVideo?.thumb;

      if (preview.endsWith('/thumb')) {
        preview += '?type=f640_362';
      }

      reducedResponse.push({
        platform: this.PLATFORM,
        name: stream?.id,
        displayName: stream?.author?.nickname,
        logo: stream?.author?.profileImageUrl,
        preview,
        title: stream?.officialVideo?.title,
        url: stream?.url,
        updatedAt: timestamp
      });
    }
    return reducedResponse;
  };
}

export default Vlive;

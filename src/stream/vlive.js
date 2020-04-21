import Livestream from '@stream/livestream';
import _ from 'lodash';
import moment from 'moment-timezone';
import request from 'request-promise';

const APP_ID = '8c6cc7b45d2568fb668be6e05b6e5a3b';
const CHANNEL_ID = '{CHANNEL_ID}';
const VLIVE_API_ENDPOINT = `https://api-vfan.vlive.tv/v2/channel.${CHANNEL_ID}/home?gcc=US&locale=en&app_id=${APP_ID}&limit=20`;
const VLIVE_VIDEO = 'https://www.vlive.tv/video/';
const IMG_REGEX = new RegExp(/(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png)/, 'gi');

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
    this.getAPIDataAndAnnounce(this.useReduceResponse, this.useMultipleCalls);
  };

  getChannelPromises = (channelId) => {
    const httpOptions = {
      url: VLIVE_API_ENDPOINT.replace(CHANNEL_ID, channelId),
      json: true
    };
    return request(httpOptions)
      .then((response) => {
        const data = _.first(
          _.filter(response.contentList, (stream) => stream.videoType === 'LIVE')
        );
        if (data) {
          data.id = channelId;
        }
        return data;
      })
      .catch((error) => this.apiError(this.PLATFORM, error));
  };

  reduceResponse = (response) => {
    const reducedResponse = [];
    for (const stream of response) {
      const timestamp = moment
        .tz(stream?.onAirStartAt, 'YYYY-MM-DD HH:mm:ss', 'Asia/Seoul')
        .tz('America/Los_Angeles')
        .toISOString();

      // magic logic to generate a thumbnail
      let thumbnail = stream?.thumbnail;
      if (!IMG_REGEX.test(thumbnail)) {
        const width = '1024';
        const height = '576';
        thumbnail = encodeURI(
          `https://dthumb-phinf.pstatic.net/?src="${thumbnail}?type=ff${width}_${height}"&twidth=${width}&theight=${height}&opts=12`
        );
      }

      reducedResponse.push({
        platform: this.PLATFORM,
        name: stream?.id,
        displayName: stream?.representChannelName,
        logo: stream?.representChannelProfileImg,
        preview: thumbnail,
        title: stream?.title,
        url: VLIVE_VIDEO + stream?.videoSeq,
        updatedAt: timestamp
      });
    }
    return reducedResponse;
  };
}

export default Vlive;

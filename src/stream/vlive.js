import { Helpers } from '@root/helpers';
import Livestream from '@stream/livestream';
import _ from 'lodash';
import moment from 'moment-timezone';
import request from 'request-promise';

const PLATFORM = 'vlive';
const APP_ID = '8c6cc7b45d2568fb668be6e05b6e5a3b';
const CHANNEL_ID = '{CHANNEL_ID}';
const VLIVE_API_ENDPOINT = `https://api-vfan.vlive.tv/v2/channel.${CHANNEL_ID}/home?gcc=US&locale=en&app_id=${APP_ID}&limit=20`;
const VLIVE_VIDEO = 'https://www.vlive.tv/video/';
const IMG_REGEX = new RegExp(/(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png)/, 'gi');

class Vlive extends Livestream {
  constructor(streamEmitter) {
    super(streamEmitter);
  }

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
      .catch((error) => Helpers.apiError(PLATFORM, error));
  };

  updateStreams = () => {
    const flattenStreamsString = Helpers.getListOfStreams('vlive');
    const currentList = [];

    _.forEach(flattenStreamsString, (stream) => currentList.push(this.getChannelPromises(stream)));

    Promise.all(currentList)
      .then(this.reduceResponse)
      .then((channelData) => Helpers.retrieveLiveChannels(this, channelData))
      .catch((error) => Helpers.apiError(PLATFORM, error));
  };

  reduceResponse = (response) => {
    const reducedResponse = [];
    response.forEach((stream) => {
      if (stream) {
        const timestamp = moment
          .tz(_.get(stream, 'onAirStartAt'), 'YYYY-MM-DD HH:mm:ss', 'Asia/Seoul')
          .tz('America/Los_Angeles')
          .toISOString();

        let thumbnail = _.get(stream, 'thumbnail');
        if (!IMG_REGEX.test(thumbnail)) {
          const width = '1024';
          const height = '576';
          // i dont know why we have to do this but we do
          thumbnail = encodeURI(
            `https://dthumb-phinf.pstatic.net/?src="${thumbnail}?type=ff${width}_${height}"&twidth=${width}&theight=${height}&opts=12`
          );
        }

        reducedResponse.push({
          platform: PLATFORM,
          name: _.get(stream, 'id'),
          displayName: _.get(stream, 'representChannelName'),
          logo: _.get(stream, 'representChannelProfileImg'),
          preview: thumbnail,
          title: _.get(stream, 'title'),
          url: VLIVE_VIDEO + _.get(stream, 'videoSeq'),
          updated_at: timestamp
        });
      }
    });
    return reducedResponse;
  };
}

export default Vlive;

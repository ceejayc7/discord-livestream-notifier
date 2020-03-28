import { TWITCH_CLIENT_ID } from '../constants';
import _ from 'lodash';
import { Helpers } from '../helpers';
import request from 'request-promise';
import Livestream from './livestream';

const PLATFORM = 'twitch';
const TWITCH_BASE_URL = 'https://www.twitch.tv';
const TWITCH_API_STREAMS_ENDPOINT = 'https://api.twitch.tv/helix/streams?first=100';
const TWITCH_API_GAMES_ENDPOINT = 'https://api.twitch.tv/helix/games?id=';
const TWITCH_API_USERS_ENDPOINT = 'https://api.twitch.tv/helix/users?id=';

class Twitch extends Livestream {
  constructor(streamEmitter) {
    super(streamEmitter);
    this.twitchAPIOptions = {
      url: TWITCH_API_STREAMS_ENDPOINT,
      headers: {
        'Client-ID': TWITCH_CLIENT_ID,
        'content-type': 'application/json'
      },
      json: true,
      method: 'GET'
    };
  }

  updateStreams = () => {
    const flattenStreamsString = Helpers.addQueryParamToList(
      'user_login',
      Helpers.getListOfStreams('twitch')
    ).join('');
    this.twitchAPIOptions.url = TWITCH_API_STREAMS_ENDPOINT + flattenStreamsString;
    request(this.twitchAPIOptions)
      .then(this.reduceResponse)
      .then((channelData) => Helpers.retrieveLiveChannels(this, channelData))
      .catch((error) => Helpers.apiError(PLATFORM, error));
  };

  reduceResponse = async (response) => {
    const reducedResponse = [];
    for (const stream of response.data) {
      let preview =
        _.get(stream, 'thumbnail_url') + `?t=${Math.round(new Date().getTime() / 1000)}`;
      preview = preview.replace('{width}', '1920').replace('{height}', '1080');
      const gameId = _.get(stream, 'game_id');
      const userId = _.get(stream, 'user_id');

      this.twitchAPIOptions.url = TWITCH_API_GAMES_ENDPOINT + gameId;
      const gamesResponse = await request(this.twitchAPIOptions);

      this.twitchAPIOptions.url = TWITCH_API_USERS_ENDPOINT + userId;
      const usersResponse = await request(this.twitchAPIOptions);

      const loginName = _.get(_.first(usersResponse.data), 'login');
      const logo = _.get(_.first(usersResponse.data), 'profile_image_url');
      const game = _.get(_.first(gamesResponse.data), 'name');
      const url = `${TWITCH_BASE_URL}/${loginName}`;

      reducedResponse.push({
        platform: PLATFORM,
        name: loginName.toLowerCase(),
        displayName: _.get(stream, 'user_name'),
        game: game,
        preview: preview,
        viewers: _.get(stream, 'viewer_count'),
        title: _.get(stream, 'title'),
        logo: logo,
        url: url,
        created_at: _.get(stream, 'started_at')
      });
    }
    return reducedResponse;
  };
}

export default Twitch;

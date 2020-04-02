import Livestream from '@stream/livestream';
import { TWITCH_CLIENT_ID } from '@root/constants';
import _ from 'lodash';
import { addQueryParamToList } from '@stream/util';
import request from 'request-promise';

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

    this.PLATFORM = 'twitch';
    this.multipleCalls = false;
    this.siteLogo = 'https://cdn.discordapp.com/emojis/287637883022737418';
    this.embedColor = 6570404;
  }

  updateStreams = () => {
    const flattenStreamsString = addQueryParamToList(
      'user_login',
      this.getListOfStreams(this.PLATFORM)
    ).join('');

    this.twitchAPIOptions.url = TWITCH_API_STREAMS_ENDPOINT + flattenStreamsString;

    this.getAPIDataAndAnnounce(this.getChannelPromises, this.reduceResponse, this.multipleCalls);
  };

  getChannelPromises = () => {
    return [request(this.twitchAPIOptions).catch((error) => this.apiError(this.PLATFORM, error))];
  };

  reduceResponse = async (response) => {
    const reducedResponse = [];
    const data = _.first(response)?.data ?? [];
    for (const stream of data) {
      let preview = stream?.thumbnail_url + `?t=${Math.round(new Date().getTime() / 1000)}`; // eslint-disable-line
      preview = preview.replace('{width}', '1920').replace('{height}', '1080');
      const gameId = stream?.game_id; // eslint-disable-line
      const userId = stream?.user_id; // eslint-disable-line

      this.twitchAPIOptions.url = TWITCH_API_GAMES_ENDPOINT + gameId;
      const gamesResponse = await request(this.twitchAPIOptions);

      this.twitchAPIOptions.url = TWITCH_API_USERS_ENDPOINT + userId;
      const usersResponse = await request(this.twitchAPIOptions);

      const loginName = _.first(usersResponse.data)?.login;
      const logo = _.first(usersResponse.data)?.profile_image_url; // eslint-disable-line
      const game = _.first(gamesResponse.data)?.name;
      const url = `${TWITCH_BASE_URL}/${loginName}`;

      reducedResponse.push({
        platform: this.PLATFORM,
        name: loginName.toLowerCase(),
        displayName: stream?.user_name, // eslint-disable-line
        game,
        preview,
        viewers: stream?.viewer_count, // eslint-disable-line
        title: stream?.title,
        logo,
        url,
        updatedAt: stream?.started_at // eslint-disable-line
      });
    }
    return reducedResponse;
  };
}

export default Twitch;

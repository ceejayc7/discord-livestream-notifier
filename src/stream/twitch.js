import Livestream from '@stream/livestream';
import _ from 'lodash';
import { addQueryParamToList } from '@stream/util';
import request from 'request-promise';

const CONSTANTS = require('@data/constants.json').tokens;
const TWITCH_BASE_URL = 'https://www.twitch.tv';
const TWITCH_API_STREAMS_ENDPOINT = 'https://api.twitch.tv/helix/streams?first=100';
const TWITCH_API_GAMES_ENDPOINT = 'https://api.twitch.tv/helix/games?id=';
const TWITCH_API_USERS_ENDPOINT = 'https://api.twitch.tv/helix/users?id=';
const TWITCH_API_OAUTH = `https://id.twitch.tv/oauth2/token?client_id=${CONSTANTS?.twitch?.clientId}&client_secret=${CONSTANTS?.twitch?.clientSecret}&grant_type=client_credentials`;

class Twitch extends Livestream {
  constructor(sendStreamMessageToServers, silentMode) {
    super(sendStreamMessageToServers);

    this.twitchAPIOptions = {
      url: TWITCH_API_STREAMS_ENDPOINT,
      headers: {
        'content-type': 'application/json'
      },
      json: true,
      method: 'GET'
    };

    this.silentMode = silentMode;
    this.PLATFORM = 'twitch';
    this.useMultipleCalls = false;
    this.useReduceResponse = true;
    this.siteLogo = 'https://cdn.discordapp.com/emojis/287637883022737418';
    this.embedColor = 6570404;
  }

  updateOAuth = async () => {
    const options = {
      url: TWITCH_API_OAUTH,
      json: true,
      method: 'POST'
    };
    const oauthResponse = await request(options).catch((error) =>
      console.log(
        `Twitch OAuth error. \t Error name: ${error.name} \t Error message: ${error.message}`
      )
    );
    if (oauthResponse) {
      this.twitchAPIOptions.headers.Authorization = `Bearer ${oauthResponse?.access_token}`; // eslint-disable-line
      return true;
    }
    return false;
  };

  updateStreams = async () => {
    const isOauthUpdated = await this.updateOAuth();
    if (!isOauthUpdated) {
      console.log(`Twitch OAuth could not be updated, skipping run`);
      return;
    }
    const flattenStreamsString = addQueryParamToList(
      'user_login',
      this.getListOfStreams(this.PLATFORM)
    ).join('');

    this.twitchAPIOptions.url = TWITCH_API_STREAMS_ENDPOINT + flattenStreamsString;
    this.getAPIDataAndAnnounce(this.useReduceResponse, this.useMultipleCalls);
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

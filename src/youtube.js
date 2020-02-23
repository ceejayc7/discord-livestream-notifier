import _ from 'lodash';
import request from 'request-promise';
import { Helpers } from './helpers';
import { YOUTUBE_KEY, WHITELIST_ALL_YOUTUBE_STREAMS } from './constants';
import moment from 'moment';

const PLATFORM = 'youtube';

class Youtube {
  constructor(streamEmitter) {
    this.currentLiveStreams = [];
    this.streamEmitter = streamEmitter;
    this.youtubeApiEndpoint = () =>
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&eventType=live&key=${this.getYoutubeKey()}&channelId=`;
    this.indexToUse = 0;
    this.resetKeysAndSetTimer();
    this.currentKey = '';
  }

  setTimer = () => {
    const timeToResetKeys =
      moment()
        .endOf('day')
        .unix() +
      1 -
      moment().unix();
    console.log(
      `Setting YouTube API reset timer to ${moment()
        .endOf('day')
        .unix() + 1}`
    );
    setTimeout(this.resetKeysAndSetTimer.bind(this), timeToResetKeys * 1000);
  };

  resetKeysAndSetTimer = () => {
    console.log('Resetting YouTube Keys');
    this.youtubeKeys = _.map(YOUTUBE_KEY, _.clone);
    console.log(this.youtubeKeys);
    this.setTimer();
  };

  getChannelPromises = (stream) => {
    const httpOptions = {
      url: this.youtubeApiEndpoint() + stream,
      json: true
    };

    return request(httpOptions).catch((error) => {
      if (_.includes(error.message, 'keyInvalid')) {
        // reset the array if the key is invalid
        this.resetKeys();
      } else if (
        _.includes(error.message, 'youtube.quota') ||
        _.includes(error.message, 'dailyLimitExceeded')
      ) {
        // if this key has hit the quota, remove it from the array
        // and rerun the request
        this.removeYoutubeKey();
        Helpers.apiError(PLATFORM, error);
        return this.getChannelPromises(stream);
      }
      Helpers.apiError(PLATFORM, error);
    });
  };

  removeYoutubeKey = () => {
    const index = this.youtubeKeys.indexOf(this.currentKey);
    this.youtubeKeys.splice(index, 1);
    console.log(`Removing ${this.currentKey}`);
    console.log(this.youtubeKeys);
  };

  getYoutubeKey = () => {
    // alternative between configured api keys to bypass quota limits
    if (Array.isArray(this.youtubeKeys)) {
      if (this.indexToUse >= this.youtubeKeys.length) {
        this.indexToUse = 0;
      }
      this.currentKey = this.youtubeKeys[this.indexToUse];
      this.indexToUse++;
      return this.currentKey;
    } else {
      return this.youtubeKeys;
    }
  };

  updateStreams = () => {
    const flattenStreamsString = Helpers.getListOfStreams('youtube');
    const currentList = [];

    _.forEach(flattenStreamsString, (stream) => currentList.push(this.getChannelPromises(stream)));

    Promise.all(currentList)
      .then(this.reduceResponse)
      .then((channelData) => Helpers.retrieveLiveChannels(this, channelData))
      .catch((error) => Helpers.apiError(PLATFORM, error));
  };

  reduceResponse = (response) => {
    const reducedResponse = [];
    const flattenedResponse = _.flatten(_.map(response, 'items'));
    _.forOwn(flattenedResponse, (stream) => {
      if (stream) {
        const title = _.get(stream, ['snippet', 'title']);
        if (WHITELIST_ALL_YOUTUBE_STREAMS || !_.includes(title, '24/7')) {
          const url = `https://www.youtube.com/watch?v=${_.get(stream, ['id', 'videoId'])}`;
          const preview =
            _.get(stream, ['snippet', 'thumbnails', 'high', 'url']) +
            `?t=${Math.round(new Date().getTime() / 1000)}`;
          reducedResponse.push({
            platform: PLATFORM,
            name: _.get(stream, ['snippet', 'channelId']),
            channelTitle: _.get(stream, ['snippet', 'channelTitle']),
            preview: preview,
            title,
            url: url,
            updated_at: new Date().toISOString()
          });
        }
      }
    });
    return reducedResponse;
  };

  announceIfStreamIsNew = (stream) => {
    const currentLiveChannels = _.map(this.currentLiveStreams, 'name');
    if (!_.includes(currentLiveChannels, stream.name)) {
      this.streamEmitter.emit('event:streamlive', stream);
    }
  };
}

export default Youtube;

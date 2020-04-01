import _ from 'lodash';

class Livestream {
  constructor(streamEmitter) {
    this.currentLiveStreams = [];
    this.streamEmitter = streamEmitter;
    this.streamsDatabase = require('@data/db.json');
    this.PLATFORM = 'livestream';
  }

  updateStreams = () => {
    throw new Error('This must be implemented');
  };

  announceIfStreamIsNew = (stream) => {
    const currentLiveChannels = _.map(this.currentLiveStreams, 'name');
    if (!_.includes(currentLiveChannels, stream.name)) {
      this.streamEmitter.emit('event:streamlive', stream);
    }
  };

  retrieveLiveChannels = (channelData) => {
    if (!_.isEmpty(channelData)) {
      for (const stream of channelData) {
        this.announceIfStreamIsNew(stream);
      }
    }
    this.currentLiveStreams = channelData;
  };

  getAPIDataAndAnnounce = (getChannelPromises, reduceResponse, multipleCalls) => {
    let promise;
    if (multipleCalls) {
      const flattenStreamsString = this.getListOfStreams(this.PLATFORM);
      const listOfPromises = [];
      for (const stream of flattenStreamsString) {
        listOfPromises.push(getChannelPromises(stream));
      }
      promise = Promise.all(listOfPromises);
    } else {
      promise = Promise.all(getChannelPromises());
    }

    return promise
      .then(_.compact)
      .then(reduceResponse)
      .then(this.retrieveLiveChannels)
      .catch((error) => this.apiError(this.PLATFORM, error));
  };

  apiError = (platform, error) => {
    console.log(
      `${platform} API error. \t Error name: ${error.name} \t Error message: ${error.message}`
    );
  };

  getListOfStreams = (streamSite) => {
    return _.uniq(_.compact(_.flatten(_.map(this.streamsDatabase, streamSite))));
  };
}

export default Livestream;

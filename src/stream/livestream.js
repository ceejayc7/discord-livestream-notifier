import _ from 'lodash';

class Livestream {
  constructor(streamEmitter) {
    this.currentLiveStreams = [];
    this.streamEmitter = streamEmitter;
    this.streamsDatabase = require('@data/db.json');
  }

  announceIfStreamIsNew = (stream) => {
    const currentLiveChannels = _.map(this.currentLiveStreams, 'name');
    if (!_.includes(currentLiveChannels, stream.name)) {
      this.streamEmitter.emit('event:streamlive', stream);
    }
  };

  retrieveLiveChannels = (channelData) => {
    if (!_.isEmpty(channelData)) {
      _.forEach(channelData, (stream) => this.announceIfStreamIsNew(stream));
    }
    this.currentLiveStreams = channelData;
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

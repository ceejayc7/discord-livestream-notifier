import _ from 'lodash';

class Livestream {
  constructor(streamEmitter) {
    this.currentLiveStreams = [];
    this.streamEmitter = streamEmitter;
  }

  announceIfStreamIsNew = (stream) => {
    const currentLiveChannels = _.map(this.currentLiveStreams, 'name');
    if (!_.includes(currentLiveChannels, stream.name)) {
      this.streamEmitter.emit('event:streamlive', stream);
    }
  };
}

export default Livestream;

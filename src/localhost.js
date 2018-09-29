import _ from 'lodash';
import request from 'request-promise';
import { Helpers } from './helpers.js';

const PLATFORM = "localhost",
    LOCALHOST_ENDPOINT = 'http://71.202.41.190:8080/live';

class Localhost {
    constructor(streamEmitter) {
        this.endpointOptions = {
            url: LOCALHOST_ENDPOINT,
            headers: {
                'content-type' : 'application/json'
            },
            json: true,
            method: "GET"
        };
        this.currentLiveStreams = {};
        this.streamEmitter = streamEmitter;
    }

    resolvedChannelPromises = (response) => {
        if (!_.isEmpty(response)) {
            _.forEach(response, (key, stream) => this.announceIfStreamIsNew(stream));
        }
        this.currentLiveStreams = response;
    }

    updateStreams = () => {
        request(this.endpointOptions)
            .then(this.resolvedChannelPromises)
            .catch((error) => Helpers.apiError(PLATFORM, error));
    }

    announceIfStreamIsNew = (stream) => {
        if(!_.includes(Object.keys(this.currentLiveStreams), stream)) {
            let streamObj = {};
            streamObj.name = stream;
            streamObj.platform = PLATFORM;
            this.streamEmitter.emit('event:streamlive', streamObj);
        }
    }
}

export default Localhost;
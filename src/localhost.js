import _ from 'lodash';
import Request from 'request';

class Localhost {

    constructor(streamEmitter) {
        this.endpoint = "http://localhost:8080/live/";
        this.endpointOptions = {
            url: this.endpoint,
            headers: {
                'content-type' : 'application/json'
            },
            json: true,
            method: "GET"
        };
        this.currentLiveStreams = {};
        this.streamEmitter = streamEmitter;
    }

    updateStreams = () => {
        Request(this.endpointOptions, (error, response, body) => {
            if(!error && response.statusCode === 200) {
                if (body) {
                    _.forEach(body, (key, stream) => {
                        this.announceIfStreamIsNew(stream);
                    });
                    this.currentLiveStreams = body;
                }
    
            } else {
                this.logError(error);
            }
        });
    }

    logError = (error) => {
        console.log('Localhost API error: ' + error);
    }

    announceIfStreamIsNew = (stream) => {
        if(!_.includes(Object.keys(this.currentLiveStreams), stream)) {
            let streamObj = {};
            streamObj.name = stream;
            streamObj.platform = "localhost";
            this.streamEmitter.emit('event:streamlive', streamObj);
        }
    }

}

export default Localhost;
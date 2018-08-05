import {MIXER_API_ENDPOINT, MIXER_CLIENT_ID} from './constants.js';
import _ from 'lodash';
import Request from 'request';
import {Helpers} from './helpers.js';

class Mixer {

    constructor(streamEmitter) {
        this.mixerAPIOptions = {
            url: MIXER_API_ENDPOINT,
            headers: {
                'Client-ID' : MIXER_CLIENT_ID,
                'content-type' : 'application/json'
            },
            json: true,
            method: "GET"
        };
        this.currentLiveStreams = [];
        this.streamEmitter = streamEmitter;
        this.streamsDatabase = require('./db.json');
    }

    getAsyncMixerChannelInfo = (url, callback) => {
        const httpOptions = {
          url :  url,
          json : true
        };

        Request(httpOptions, (error, response, body) => {
            if(!error && response.statusCode === 200) {
                callback(error, body);
            } else {
                this.logError(error);
            }
        });
    }

    updateStreams = () => {
        const flattenStreamsString = Helpers.getListOfStreams('mixer'),
            async = require('async');
        let endpoint = MIXER_API_ENDPOINT,
            currentList = [];

        _.forEach(flattenStreamsString, (stream) => {
            currentList.push(endpoint+stream);
        });

        async.map(currentList, this.getAsyncMixerChannelInfo, (error, reponse) => {
            if (error) {
                this.logError(error);
            }

            let newStreams = this.reduceResponse(reponse);
    
            if (newStreams) {
                _.forEach(newStreams, (stream) => {
                    this.announceIfStreamIsNew(stream);
                });
                this.currentLiveStreams = newStreams;
            }
        });
    }

    reduceResponse = (response) => {
        let reducedResponse = [];
        _.forOwn(response, function(stream) {
            if(stream && stream.online) {
                let url = `https://mixer.com/${_.get(stream, 'token')}`;
                reducedResponse.push(
                    {
                        "platform" : "mixer",
                        "name": _.get(stream, 'token'),
                        "game": _.get(stream, ['type', 'name']),
                        "preview": _.get(stream, ['thumbnail', 'url']),
                        "viewers": _.get(stream, 'viewersCurrent'),
                        "title": _.get(stream, 'name'),
                        "logo": _.get(stream, ['user','avatarUrl']),
                        "url": url,
                        "updated_at": _.get(stream, 'updatedAt')
                    });
            }
        });
        return reducedResponse;
    }

    logError = (error) => {
        console.log('Mixer API error: ' + error);
    }

    announceIfStreamIsNew = (stream) => {
        let currentLiveChannels = _.map(this.currentLiveStreams, 'name');
        if(!_.includes(currentLiveChannels, stream.name)) {
            this.streamEmitter.emit('event:streamlive', stream);
        }
    }
}

export default Mixer;
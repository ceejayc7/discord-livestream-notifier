import {TWITCH_API_ENDPOINT, TWITCH_CLIENT_ID} from './constants.js';
import _ from 'lodash';
import Emitter from 'events';
import Request from 'request';

class Twitch {

    constructor(streamEmitter) {
        this.twitchAPIOptions = {
            url: TWITCH_API_ENDPOINT,
            headers: {
                'Client-ID' : TWITCH_CLIENT_ID,
                'content-type' : 'application/json'
            },
            json: true,
            method: "GET"
        };
        this.currentLiveStreams = [];
        this.streamEmitter = streamEmitter;
        this.streamsDatabase = require('./db.json');
    }

    updateStreams() {
        let flattenStreamsString = _.uniq(_.flatten(_.map(this.streamsDatabase, 'twitch'))).toString();
        this.twitchAPIOptions.url = TWITCH_API_ENDPOINT+flattenStreamsString;
        Request(this.twitchAPIOptions, (error, response, body) => {
            if(!error && response.statusCode === 200) {
                let newStreams = this.constructor.reduceResponse(body);
    
                if (newStreams) {
                    _.forEach(newStreams, (stream) => {
                        this.announceIfStreamIsNew(stream);
                    });
                    this.currentLiveStreams = newStreams;
                }
    
            } else {
                this.logError(error);
            }
        });
    }

    static reduceResponse(response) {
        let reducedResponse = [];
        _.forOwn(response.streams, function(stream) {
            reducedResponse.push(
                {
                    "platform" : "twitch",
                    "channelName": _.get(stream, ['channel','display_name']),
                    "game": _.get(stream, 'game'),
                    "preview": _.get(stream, ['preview', 'medium']),
                    "viewers": _.get(stream, 'viewers'),
                    "title": _.get(stream, ['channel','status']),
                    "logo": _.get(stream, ['channel','logo']),
                    "url": _.get(stream, ['channel','url'])
                }
            );
        });
        return reducedResponse;
    }

    logError(error) {
        console.log('Twitch API error: ' + error);
    }

    announceIfStreamIsNew(stream) {
        let currentLiveChannels = _.map(this.currentLiveStreams, 'channelName');
        if(!_.includes(currentLiveChannels, stream.channelName)) {
            this.streamEmitter.emit('event:streamlive', stream);
        }
    }
}

export default Twitch;
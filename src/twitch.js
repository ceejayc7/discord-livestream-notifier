import {TWITCH_API_ENDPOINT, TWITCH_CLIENT_ID} from './constants.js';
import _ from 'lodash';
import {Helpers} from './helpers.js';
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

    updateStreams = () => {
        let flattenStreamsString = Helpers.getListOfStreams('twitch').toString();
        this.twitchAPIOptions.url = TWITCH_API_ENDPOINT+flattenStreamsString;
        Request(this.twitchAPIOptions, (error, response, body) => {
            if(!error && response.statusCode === 200) {
                let newStreams = this.reduceResponse(body);
    
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

    reduceResponse = (response) => {
        let reducedResponse = [];
        _.forOwn(response.streams, function(stream) {
            reducedResponse.push(
                {
                    "platform" : "twitch",
                    "name": _.get(stream, ['channel','name']),
                    "displayName": _.get(stream, ['channel','display_name']),
                    "game": _.get(stream, 'game'),
                    "preview": _.get(stream, ['preview', 'large']),
                    "viewers": _.get(stream, 'viewers'),
                    "title": _.get(stream, ['channel','status']),
                    "logo": _.get(stream, ['channel','logo']),
                    "url": _.get(stream, ['channel','url']),
                    "created_at": _.get(stream, 'created_at')
                }
            );
        });
        return reducedResponse;
    }

    logError = (error) => {
        console.log('Twitch API error: ' + error);
    }

    announceIfStreamIsNew = (stream) => {
        let currentLiveChannels = _.map(this.currentLiveStreams, 'name');
        if(!_.includes(currentLiveChannels, stream.name)) {
            this.streamEmitter.emit('event:streamlive', stream);
        }
    }
}

export default Twitch;
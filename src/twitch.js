import { TWITCH_CLIENT_ID } from './constants.js';
import _ from 'lodash';
import { Helpers } from './helpers.js';
import request from 'request-promise';

const TWITCH_API_ENDPOINT='https://api.twitch.tv/kraken/streams?limit=100&channel=';

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

    resolvedChannelPromises = (response) => {
        if (!_.isEmpty(response)) {
            _.forEach(response, (stream) => this.announceIfStreamIsNew(stream));
            this.currentLiveStreams = response;
        }
    }

    updateStreams = () => {
        let flattenStreamsString = Helpers.getListOfStreams('twitch').toString();
        this.twitchAPIOptions.url = TWITCH_API_ENDPOINT+flattenStreamsString;

        request(this.twitchAPIOptions)
            .then(this.reduceResponse)
            .then(this.resolvedChannelPromises)
            .catch(this.logError);
    }

    reduceResponse = (response) => {
        let reducedResponse = [];
        _.forOwn(response.streams, function(stream) {
            let preview = _.get(stream, ['preview', 'large']) + `?t=${Math.round((new Date()).getTime() / 1000)}`;
            reducedResponse.push(
                {
                    "platform" : "twitch",
                    "name": _.get(stream, ['channel','name']),
                    "displayName": _.get(stream, ['channel','display_name']),
                    "game": _.get(stream, 'game'),
                    "preview": preview, 
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
import { MIXER_CLIENT_ID } from './constants.js';
import _ from 'lodash';
import request from 'request-promise';
import { Helpers } from './helpers.js';

const MIXER_API_ENDPOINT='https://mixer.com/api/v1/channels/';

class Mixer {
    constructor(streamEmitter) {
        this.currentLiveStreams = [];
        this.streamEmitter = streamEmitter;
        this.streamsDatabase = require('./db.json');
    }

    getChannelPromises = (url) => {
        const httpOptions = {
            url :  MIXER_API_ENDPOINT+url,
            json : true,
            headers: {
                'Client-ID' : MIXER_CLIENT_ID,
                'content-type' : 'application/json'
            }
        };
        return request(httpOptions)
            .catch(this.logError);
    }

    resolvedChannelPromises = (channelData) => {
        if (!_.isEmpty(channelData)) {
            _.forEach(channelData, (stream) => this.announceIfStreamIsNew(stream));
            this.currentLiveStreams = channelData;
        }
    }

    updateStreams = () => {
        const flattenStreamsString = Helpers.getListOfStreams('mixer');
        let currentList = [];

        _.forEach(flattenStreamsString, (stream) => currentList.push(this.getChannelPromises(stream)));

        Promise.all(currentList)
            .then(this.reduceResponse)
            .then(this.resolvedChannelPromises)
            .catch(this.logError);
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
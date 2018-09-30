import { MIXER_CLIENT_ID } from './constants.js';
import _ from 'lodash';
import request from 'request-promise';
import { Helpers } from './helpers.js';

const PLATFORM = "mixer",
    MIXER_API_ENDPOINT='https://mixer.com/api/v1/channels/';

class Mixer {
    constructor(streamEmitter) {
        this.currentLiveStreams = [];
        this.streamEmitter = streamEmitter;
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
            .catch((error) => Helpers.apiError(PLATFORM, error));
    }

    updateStreams = () => {
        const flattenStreamsString = Helpers.getListOfStreams('mixer');
        let currentList = [];

        _.forEach(flattenStreamsString, (stream) => currentList.push(this.getChannelPromises(stream)));

        Promise.all(currentList)
            .then(this.reduceResponse)
            .then((channelData) => Helpers.retrieveLiveChannels(this, channelData))
            .catch((error) => Helpers.apiError(PLATFORM, error));
    }

    reduceResponse = (response) => {
        let reducedResponse = [];
        _.forOwn(response, function(stream) {
            if(stream && stream.online) {
                let url = `https://mixer.com/${_.get(stream, 'token')}`;
                reducedResponse.push(
                    {
                        "platform" : PLATFORM,
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

    announceIfStreamIsNew = (stream) => {
        let currentLiveChannels = _.map(this.currentLiveStreams, 'name');
        if(!_.includes(currentLiveChannels, stream.name)) {
            this.streamEmitter.emit('event:streamlive', stream);
        }
    }
}

export default Mixer;
import _ from 'lodash';
import request from 'request-promise';
import { Helpers } from './helpers.js';

const YOUTUBE_API_ENDPOINT='https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&eventType=live&key=AIzaSyC760DQ5d-ULu_8s-lhDK8sN_uyfkLaUjI&channelId=';

class Youtube {
    constructor(streamEmitter) {
        this.currentLiveStreams = [];
        this.streamEmitter = streamEmitter;
        this.streamsDatabase = require('./db.json');
    }

    getChannelPromises = (stream) => {
        const httpOptions = {
            url :  YOUTUBE_API_ENDPOINT+stream,
            json : true
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
        const flattenStreamsString = Helpers.getListOfStreams('youtube');
        let currentList = [];

        _.forEach(flattenStreamsString, (stream) => currentList.push(this.getChannelPromises(stream)));

        Promise.all(currentList)
            .then(this.reduceResponse)
            .then(this.resolvedChannelPromises)
            .catch(this.logError);
    }

    reduceResponse = (response) => {
        let reducedResponse = [],
            flattenedResponse = _.flatten(_.map(response, 'items'));
        _.forOwn(flattenedResponse, function(stream) {
            if(stream) {
                let url = `https://www.youtube.com/watch?v=${_.get(stream, ['id', 'videoId'])}`,
                    preview = _.get(stream, ['snippet', 'thumbnails', 'high', 'url']) + `?t=${Math.round((new Date()).getTime() / 1000)}`;
                reducedResponse.push(
                    {
                        "platform" : "youtube",
                        "name": _.get(stream, ['snippet', 'channelId']),
                        "channelTitle": _.get(stream, ['snippet', 'channelTitle']),
                        "preview": preview,
                        "title": _.get(stream, ['snippet', 'title']),
                        "url": url,
                        "updated_at": _.get(stream, ['snippet', 'publishedAt'])
                    });
            }
        });
        return reducedResponse;
    }

    logError = (error) => {
        console.log('Youtube API error: ' + error);
    }

    announceIfStreamIsNew = (stream) => {
        let currentLiveChannels = _.map(this.currentLiveStreams, 'name');
        if(!_.includes(currentLiveChannels, stream.name)) {
            this.streamEmitter.emit('event:streamlive', stream);
        }
    }
}

export default Youtube;
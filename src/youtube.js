import { YOUTUBE_API_ENDPOINT } from './constants.js';
import _ from 'lodash';
import Request from 'request';
import { Helpers } from './helpers.js';

class Youtube {

    constructor(streamEmitter) {
        this.mixerAPIOptions = {
            url: YOUTUBE_API_ENDPOINT,
            headers: {
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
        const flattenStreamsString = Helpers.getListOfStreams('youtube'),
            async = require('async');
        let endpoint = YOUTUBE_API_ENDPOINT,
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
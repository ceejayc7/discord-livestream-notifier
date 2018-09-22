import _ from 'lodash';
import request from 'request-promise';
import cheerio from 'cheerio';
import { Helpers } from './helpers.js';

const OKRU_BASE_URL = 'https://ok.ru',
    OKRU_ENDPOINT = 'https://ok.ru/live/profile/',
    PROTOCOL = 'https:';

class OkRu {
    constructor(streamEmitter) {
        this.currentLiveStreams = [];
        this.streamEmitter = streamEmitter;
        this.streamsDatabase = require('./db.json');
    }

    scrapePage = ($) => {
        if($('.video-card_live.__active').length) {
            const streamUrl = OKRU_BASE_URL + $('.video-card_img-w a').attr('href'),
                channelName = $('.compact-profile_img a').attr('href').match(/\d+/g).map(Number).toString(),
                title = $('.video-card_img-w a').attr('title'),
                channelLogo = PROTOCOL + $('.channel-panel_img-w img').attr('src'),
                preview = PROTOCOL + $('.video-card_img-w a img').attr('src'),
                displayName = $('.compact-profile_a.ellip-i').text();
                
            return {
                "platform" : "okru",
                "name" : channelName,
                "displayName" : displayName,
                "title" : title,
                "logo" : channelLogo,
                "url" : streamUrl,
                "preview" : preview
            };
        }
    }

    getChannelPromises = (url) => {
        const httpOptions = {
            url :  url,
            transform: function (body) {
                return cheerio.load(body);
            }
        };

        return request(httpOptions)
            .then(this.scrapePage)
            .catch(this.logError);
    }

    resolvedChannelPromises = (channelData) => {
        if (!_.isEmpty(channelData)) {
            _.forEach(channelData, (stream) => this.announceIfStreamIsNew(stream));
            this.currentLiveStreams = channelData;
        }
    }

    updateStreams = () => {
        const flattenStreamsString = Helpers.getListOfStreams('okru');
        let currentList = [];

        _.forEach(flattenStreamsString, (stream) => currentList.push(this.getChannelPromises(OKRU_ENDPOINT+stream)));

        Promise.all(currentList)
            .then(_.compact)
            .then(this.resolvedChannelPromises)
            .catch(this.logError);
    }

    logError = (error) => {
        console.log('OkRu API error: ' + error);
    }

    announceIfStreamIsNew = (stream) => {
        let currentLiveChannels = _.map(this.currentLiveStreams, 'name');
        if(!_.includes(currentLiveChannels, stream.name)) {
            this.streamEmitter.emit('event:streamlive', stream);
        }
    }
}

export default OkRu;
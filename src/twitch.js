const request = require('request'),
    _ = require('lodash'),
    constants = require('./constants.js'),
    streams = require('./db.json');
    
let options = {
    url: constants.TWITCH_API_ENDPOINT,
    headers: {
        'Client-ID' : constants.TWITCH_CLIENT_ID,
        'content-type' : 'application/json'
    },
    json: true,
    method: "GET"
},
    currentLiveStreams = [];

function updateStreams() {
    options.url = constants.TWITCH_API_ENDPOINT+streams.twitch.toString();
    request(options, requestResponseCallback);
}


function reduceResponse(response) {
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

function logError(error) {
    console.log('Twitch API error: ' + error);
}

function announceIfStreamIsNew(stream) {
    let currentLiveChannels = _.map(currentLiveStreams, 'channelName');
    if(!_.includes(currentLiveChannels, stream.channelName)) {
        console.log(stream);
        // fire an event to discordjs to write a message
    }
}

function requestResponseCallback(error, response, body) {
    if(!error && response.statusCode === 200) {
        let newStreams = reduceResponse(body);

        if (newStreams) {
            _.forEach(newStreams, announceIfStreamIsNew);
            currentLiveStreams = newStreams;
        }

    } else {
        logError(error);
    }
}

updateStreams();

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
};

function updateStreams() {
    options.url = constants.TWITCH_API_ENDPOINT+streams.twitch.toString();
}

function parseResponse(response) {
    console.log(_.get(response, 'streams'));
}

function logError(error) {
    console.log('Twitch API error: ' + error);
}

function callback(error, response, body) {
    if(!error && response.statusCode == 200) {
        parseResponse(body);
    } else {
        logError(error);
    }
}

updateStreams();
request(options, callback);

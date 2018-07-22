# discord-livestream-notifier
> Broadcast when Twitch.tv streams go live on Discord

## Getting started
Clone the repository and install npm dependencies
```bash
$ git clone https://github.com/ceejayc7/discord-livestream-notifier.git
$ npm install
```

Edit `src/db.json` to include the streams to be watching
```js
{
    "SERVER_ONE_NAME":{
        "twitch": [
            "streamer1",
            "streamer2"
        ]
    },
    "SERVER_TWO_NAME":{
        "twitch": [
            "streamer1",
            "streamer2"
        ]
    }
}
```

Edit `src/constants.js` to include your tokens
```js
export const TWITCH_CLIENT_ID='YOUR_TWITCH_CLIENT_ID_HERE',
    TWITCH_API_ENDPOINT='https://api.twitch.tv/kraken/streams?channel=',
    DISCORD_TOKENS={
        SERVER_ONE_NAME: 'DISCORD_TOKEN_FOR_SERVER_ONE_NAME',
        SERVER_TWO_NAME: 'DISCORD_TOKEN_FOR_SERVER_TWO_NAME'
    };
```

Build and run
```bash
$ npm run build
$ npm run start
```

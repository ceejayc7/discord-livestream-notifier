# discord-livestream-notifier
> Broadcasts when a livestream goes live to a discord channel. Also contains random fun casino games.

>Supports the following platforms:
>* Twitch.tv
>* Mixer

## Getting started
Clone the repository and install npm dependencies
```bash
$ git clone https://github.com/ceejayc7/discord-livestream-notifier.git
$ npm install
```

Add `src/db.json` to include the streams to be watching
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

Add `src/constants.js` to include your tokens
```js
export const TWITCH_CLIENT_ID='TWITCH_CLIENT_ID_HERE',
    TWITCH_API_ENDPOINT='https://api.twitch.tv/kraken/streams?channel=',
    MIXER_API_ENDPOINT='https://mixer.com/api/v1/channels/',
    MIXER_CLIENT_ID='MIXER_CLIENT_ID_HERE',
    DISCORD_TOKENS={
        SERVER_ONE_NAME: 'TOKEN_ONE',
        SERVER_TWO_NAME: 'TOKEN_TWO'
    },
    LOCALHOST_ENDPOINT='localhost',
    LOCALHOST_VIEWER='localhost',
    CHANNEL_TO_SEND_LIVESTREAM_NOTIFICATIONS='general',
    BLACKLISTED_SERVER={}; // { server : channel } pairs
```

Build and run
```bash
$ npm run build
$ npm run start
```

For further help on setting up a Discord bot, visit https://discordpy.readthedocs.io/en/rewrite/discord.html

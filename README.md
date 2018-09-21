# discord-livestream-notifier
> Broadcasts when a livestream goes live to a discord channel. Also contains random fun casino games.

>Supports the following platforms:
>* Twitch.tv
>* Mixer
>* Youtube

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
        ],
        "mixer": [
            "streamer3"
        ],
        "youtube": [
            "channelID1",
            "channelID2"
        ]
    }
}
```

Add `src/constants.js` to include your tokens
```js
export const TWITCH_CLIENT_ID='{YOUR_TWITCH_CLIENT_ID_HERE}',
    TWITCH_API_ENDPOINT='https://api.twitch.tv/kraken/streams?limit=100&channel=',
    MIXER_API_ENDPOINT='https://mixer.com/api/v1/channels/',
    MIXER_CLIENT_ID='{YOUR_MIXER_CLIENT_ID_HERE}',
    YOUTUBE_API_ENDPOINT='https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&eventType=live&key={YOUR_CLIENT_KEY_HERE}&channelId=',
    DISCORD_TOKENS={
        servername1: '{YOUR_DISCORD_TOKEN_HERE}',
        servername2: '{YOUR_DISCORD_TOKEN_HERE}',
        servername3: '{YOUR_DISCORD_TOKEN_HERE}',
        servername4: '{YOUR_DISCORD_TOKEN_HERE}',
    },
    LOCALHOST_ENDPOINT='',
    LOCALHOST_VIEWER='',
    CHANNEL_TO_SEND_LIVESTREAM_NOTIFICATIONS='general',
    WHITELISTED_SERVERS={
        servername1 : {channelName},
        servername2 : {channelName}
    },
    SERVER_FOR_FISHING={servername};
```

Build and run
```bash
$ npm run build
$ npm run start
```

For further help on setting up a Discord bot, visit https://discordpy.readthedocs.io/en/rewrite/discord.html

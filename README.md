# discord-livestream-notifier
> Broadcasts when a livestream goes live to a discord channel. Also contains random fun casino games.

>Supports the following platforms:
>* Twitch.tv
>* Mixer
>* Youtube
>* Ok.RU (via web scraping)

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
    MIXER_CLIENT_ID='{YOUR_MIXER_CLIENT_ID_HERE}',
    YOUTUBE_KEY='{YOUR_YOUTUBE_API_KEY_HERE}',
    DISCORD_TOKENS={
        servername1: '{YOUR_DISCORD_TOKEN_HERE}',
        servername2: '{YOUR_DISCORD_TOKEN_HERE}',
        servername3: '{YOUR_DISCORD_TOKEN_HERE}',
        servername4: '{YOUR_DISCORD_TOKEN_HERE}',
    },
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

# discord-livestream-notifier

Broadcasts when a livestream goes live to a discord channel. Also contains random fun casino games.

Supports the following platforms:

> - Twitch.tv
> - Mixer
> - Youtube
> - Ok.RU (via web scraping)
> - Vlive
> - Afreeca

## Getting started

Clone the repository and install npm dependencies

```bash
$ git clone https://github.com/ceejayc7/discord-livestream-notifier.git
$ npm install
```

Add `src/data/db.json` to include the streams to be watching

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
    ],
    "okru": [
      "profile1",
      "profile2"
    ],
    "vlive": [
      "channelCode1",
      "channelCode2"
    ],
    "afreeca": [
      "streamID1",
      "streamID2"
    ]
  }
}
```

Add `src/data/constants.json` to include tokens and server configuration

```js
{
  "serverConfig": {
    "SERVER_ONE_NAME": {
      "discordToken": "DISCORD_TOKEN",
      "streamChannels": ["VALID_CHANNEL_NAME"],
      "casinoChannels": ["VALID_CHANNEL_NAME"],
      "kpopChannels": ["VALID_CHANNEL_NAME", "VALID_CHANNEL_NAME"],
      "allowFishing": true,
      "allowTweeting": true
    },
    "SERVER_TWO_NAME": {
      "discordToken": "DISCORD_TOKEN",
      "streamChannels": ["VALID_CHANNEL_NAME"],
      "casinoChannels": ["VALID_CHANNEL_NAME"],
      "allowFishing": false
    }
  },
  "tokens": {
    "twitch": {
      "clientId": "TWITCH_CLIENT_ID",
      "clientSecret": "TWITCH_CLIENT_SECRET"
    },
    "mixer": {
      "clientId": "MIXER_CLIENT_ID"
    },
    "youtube": {
      "apiKey": "YOUTUBE_API_KEY"
    },
    "twitter": {
      "consumerKey": "TWITTER_CONSUMER_KEY",
      "consumerSecret": "TWITTER_CONSUMER_SECRET",
      "accessTokenKey": "TWITTER_ACCESS_TOKEN_KEY",
      "accessTokenSecret": "TWITTER_ACCESS_TOKEN_SECRET"
    }
  },
  "overrides": {
    "include24HourYouTubeStreams": false
  }
}

```

Build and run

```bash
$ npm run build
$ npm run start
```

For further help on setting up a Discord bot, visit https://discordpy.readthedocs.io/en/rewrite/discord.html

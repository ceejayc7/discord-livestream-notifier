# discord-livestream-notifier

Broadcasts when a livestream goes live to a discord channel. Also contains random fun casino games.

Supports the following platforms:

> - Twitch.tv
> - Mixer
> - Youtube
> - Ok.RU (via web scraping)
> - Vlive

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
        ]
    }
}
```

Add `src/constants.js` to include your tokens

```js
export const TWITCH_CLIENT_ID = '{YOUR_TWITCH_CLIENT_ID_HERE}';
export const MIXER_CLIENT_ID = '{YOUR_MIXER_CLIENT_ID_HERE}';
export const YOUTUBE_KEY = '{YOUR_YOUTUBE_API_KEY_HERE}';
export const DISCORD_TOKENS = {
  servername1: '{YOUR_DISCORD_TOKEN_HERE}',
  servername2: '{YOUR_DISCORD_TOKEN_HERE}',
  servername3: '{YOUR_DISCORD_TOKEN_HERE}',
  servername4: '{YOUR_DISCORD_TOKEN_HERE}'
};
export const CHANNEL_TO_SEND_LIVESTREAM_NOTIFICATIONS = 'general';
export const WHITELISTED_SERVERS = {
  servername1: { channelName },
  servername2: { channelName }
};
export const SERVER_FOR_FISHING = { servername };
// Used to scrape kpop data
export const TWITTER = {
  consumer_key: '{YOUR_CONSUMER_KEY}',
  consumer_secret: '{YOUR_CONSUMER_SECRET}',
  access_token_key: '{YOUR_ACCESS_TOKEN_KEY}',
  access_token_secret: '{ACCESS_TOKEN_SECRET}'
};
// Boolean to send kpop data on okru streams
export const SEND_KPOP_IPTV = {
  server: 'SERVER_TO_SEND_TO',
  channelId: 'CHANNEL_ID_TO_SEND_TO'
};
// Whitelist 24/7 streams to be broadcasted by the bot. This just checks if the stream title has the substring "24/7"
export const WHITELIST_ALL_YOUTUBE_STREAMS = false;
```

Build and run

```bash
$ npm run build
$ npm run start
```

For further help on setting up a Discord bot, visit https://discordpy.readthedocs.io/en/rewrite/discord.html

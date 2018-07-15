const Discord = require('discord.js'),
    emitter = require('events'),
    streamEmitter = new emitter.EventEmitter();
    constants = require('./constants.js'),
    client = new Discord.Client(),
    _ = require('lodash'),
    request = require('request'),
    streamsDatabase = require('./db.json'),

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    twitch = require('./twitch.js')(_, constants, request, streamsDatabase, streamEmitter);
});


streamEmitter.on('event:streamlive', (stream) => {
    client.channels.find('name','general').send('test');
});

client.login(constants.DISCORD_TOKEN);


/*
client.on('message', msg => {
    if (msg.content === 'ping') {
      msg.reply('pong');
  }
});
*/
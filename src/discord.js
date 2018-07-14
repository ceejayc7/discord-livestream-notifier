const Discord = require('discord.js'),
    client = new Discord.Client(),
    constants = require('./constants.js'),
    twitch = require('./twitch.js');

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
  if (msg.content === 'ping') {
    msg.reply('pong');
  }
});

client.login(constants.DISCORD_TOKEN);
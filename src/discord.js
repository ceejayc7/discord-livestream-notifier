import Bot from './bot.js';
import Twitch from './twitch.js';
import {EventEmitter} from 'events';

const streamEmitter = new EventEmitter();

const discordBot = new Bot(streamEmitter);
discordBot.attachListeners();
discordBot.loginToDiscord();

const twitch = new Twitch(streamEmitter);
twitch.updateStreams();
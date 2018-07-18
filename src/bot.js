import {DISCORD_TOKENS} from './constants.js';
import Discord from 'discord.js';


class Bot {
    constructor(streamEmitter) {
        this.streamEmitter = streamEmitter;
        this.client = new Discord.Client();
        this.isLoggedIn = false;
    }

    loginToDiscord() {
        this.client.login(DISCORD_TOKENS.reflectedtest);
    };

    attachListeners() {
        this.client.on('ready', () => {
            console.log(`Logged in as ${this.client.user.tag}!`);
            this.isLoggedIn = true;
        });
        
        this.streamEmitter.on('event:streamlive', (stream) => {
            if(this.isLoggedIn) {
                this.client.channels.find('name','general').send('test');
            }
        });
    }

}

export default Bot;
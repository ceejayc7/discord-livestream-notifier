import { EventEmitter } from 'events';
import Trivia from '@casino/trivia';
import { sendMessageToChannel } from '@root/util';

class TriviaManager {
  constructor() {
    this.activeGames = {};
    this.event = new EventEmitter();
  }

  createNewTrivia(msg, client) {
    const serverID = msg.guild.id;
    const channelID = msg.channel.id;
    if (this.activeGames?.[serverID]?.channelID === channelID) {
      sendMessageToChannel(msg, 'Game in progress bro');
    } else {
      const triviaInstance = new Trivia(msg, client, this.event);
      this.activeGames[serverID] = { channelID, triviaInstance };
      this.event.on('deleteTrivia', this.deleteTrivia.bind(this));
    }
  }

  deleteTrivia(msg) {
    const serverID = msg.guild.id;
    delete this.activeGames[serverID];
  }
}

export default TriviaManager;

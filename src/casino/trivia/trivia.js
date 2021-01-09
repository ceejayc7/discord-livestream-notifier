import { BOT_COMMANDS } from '@root/constants';
import Discord from 'discord.js';
import { MoneyManager } from '@casino/moneymanager';
import _ from 'lodash';
import { getQuestions } from '@casino/trivia/triviaquestions';
import { sendMessageToChannel } from '@root/util';

class Trivia {
  constructor(msg, client, event) {
    this.gameState = {
      client,
      msg,
      channel: msg.channel.name,
      isGameStarted: false,
      questionTimer: null,
      triviaTimer: null,
      hintTimer: null,
      questions: [],
      currentReward: 0,
      currentQuestion: null,
      currentDifficulty: null,
      winners: {},
      questionNumber: 0,
      color: null
    };
    this.event = event;
    this.init();
  }

  async init() {
    const wasUpdated = await this.fetchQuestions();
    if (wasUpdated) {
      this.gameState.isGameStarted = true;
      this.channelListener();
      this.handleTriviaTimer();
      this.sendQuestion();
    }
  }

  completedQuestion() {
    this.gameState.currentQuestion = null;
    this.clearQuestionTimer();
    this.gameState.questions.shift();
  }

  handleTriviaTimer() {
    clearTimeout(this.gameState.triviaTimer);
    this.gameState.triviaTimer = setTimeout(this.stopGame.bind(this), 120000);
  }

  sendSessionStats() {
    if (_.isEmpty(this.gameState.winners)) {
      sendMessageToChannel(this.gameState.msg, `${this.gameState.msg.member.user} bro?`);
      return;
    }

    const stats = new Discord.MessageEmbed().setTitle('Results').setColor('#ccffcc');
    for (const user in this.gameState.winners) {
      if (user in this.gameState.winners) {
        stats.addField(
          user,
          `${this.gameState.winners[user].roundsWon} answered correctly and won ${this.gameState.winners[user].bitcoinWon} bitcoin`
        );
      }
    }
    sendMessageToChannel(this.gameState.msg, stats);
  }

  stopGame() {
    this.sendSessionStats();
    this.event.emit('deleteTrivia', this.gameState.msg);
    this.removeChannelListener();
    this.gameState.isGameStarted = false;
    this.gameState.questions = [];
    this.gameState.currentQuestion = null;
    this.clearQuestionTimer();
    this.gameState.triviaTimer = null;
    this.gameState.winners = {};
  }

  handleWinner(msg) {
    const username = msg.member.displayName;
    if (this.gameState.winners?.[username]) {
      const roundsWon = this.gameState.winners[username].roundsWon + 1;
      const bitcoinWon = this.gameState.winners[username].bitcoinWon + this.gameState.currentReward;

      this.gameState.winners[username] = {
        roundsWon,
        bitcoinWon
      };
    } else {
      this.gameState.winners[username] = {
        roundsWon: 1,
        bitcoinWon: this.gameState.currentReward
      };
    }
  }

  onMessage(msg) {
    if (this.gameState.isGameStarted && msg.content === BOT_COMMANDS.STOP.command) {
      clearTimeout(this.gameState.triviaTimer);
      this.stopGame();
      return;
    }
    if (
      msg.channel.name === this.gameState.channel &&
      msg.member.user.bot === false &&
      this.gameState.isGameStarted &&
      this.gameState.currentQuestion
    ) {
      this.handleTriviaTimer();
      const answer = this.gameState.currentQuestion.correct_answer;
      if (msg.content.toLowerCase() === answer.toLowerCase().trim()) {
        sendMessageToChannel(msg, `${msg.member.user} got it! The answer was: **${answer}**`);
        this.handleWinner(msg);
        MoneyManager.addMoney(msg, this.gameState.currentReward);
        this.sendNextQuestion();
      }
    }
  }

  channelListener() {
    this.gameState.client.on('message', this.onMessage.bind(this));
  }

  removeChannelListener() {
    this.gameState.client.off('message', this.onMessage);
  }

  sendNextQuestion() {
    this.completedQuestion();
    setTimeout(this.sendQuestion.bind(this), 10000);
  }

  setEmbedColorAndSetReward() {
    switch (this.gameState.currentQuestion.difficulty) {
      case 'easy':
        this.gameState.currentReward = 100;
        this.gameState.color = '#66d9ff';
        break;
      case 'medium':
        this.gameState.currentReward = 500;
        this.gameState.color = '#009933';
        break;
      case 'hard':
        this.gameState.currentReward = 1000;
        this.gameState.color = '#ff3300';
        break;
      default:
        this.gameState.currentReward = 500;
        this.gameState.color = '#ffffff';
        break;
    }
  }

  createMessageEmbed() {
    const question = this.gameState.currentQuestion.question;
    this.setEmbedColorAndSetReward();
    return new Discord.MessageEmbed()
      .setColor(this.gameState.color)
      .setTitle(`${this.gameState.questionNumber}. ${question}`)
      .setDescription(this.gameState.currentQuestion.category);
  }

  getRevealedCharacters() {
    const answer = this.gameState.currentQuestion.correct_answer.replace(' ', '');
    const length = Math.ceil(answer.length / 4);
    return _.sampleSize(answer, length);
  }

  hintCallback() {
    const answer = this.gameState.currentQuestion.correct_answer;
    const revealed = this.getRevealedCharacters();
    let hidden = '';
    for (const char of answer) {
      if (char === ' ') {
        hidden += ' ';
      } else if (revealed.includes(char)) {
        hidden += char;
      } else {
        hidden += '-';
      }
    }
    sendMessageToChannel(this.gameState.msg, `\`\`\`Hint: ${hidden}\`\`\``);
  }

  startQuestionTimer() {
    this.gameState.questionTimer = setTimeout(this.questionTimerCallback.bind(this), 45000);
    this.gameState.hintTimer = setTimeout(this.hintCallback.bind(this), 20000);
  }

  clearQuestionTimer() {
    clearTimeout(this.gameState.questionTimer);
    this.gameState.questionTimer = null;
    clearTimeout(this.gameState.hintTimer);
    this.gameState.hintTimer = null;
  }

  questionTimerCallback() {
    if (this.gameState.isGameStarted) {
      sendMessageToChannel(
        this.gameState.msg,
        `Nobody got it. The correct answer was: **${this.gameState.currentQuestion.correct_answer}**`
      );
      this.sendNextQuestion();
    }
  }

  async setQuestion() {
    if (this.gameState.questions.length === 0) {
      await this.fetchQuestions();
    }
    this.gameState.currentQuestion = this.gameState.questions[0];
    this.gameState.questionNumber = this.gameState.questionNumber + 1;
  }

  async sendQuestion() {
    if (!this.gameState.isGameStarted) {
      return;
    }
    await this.setQuestion();
    const question = this.createMessageEmbed();
    sendMessageToChannel(this.gameState.msg, question);
    // console.log(this.gameState.currentQuestion.correct_answer);
    this.startQuestionTimer();
  }

  async fetchQuestions() {
    const questions = await getQuestions();
    if (_.isEmpty(questions)) {
      return false;
    }
    this.gameState.questions = questions;
    return true;
  }
}

export default Trivia;

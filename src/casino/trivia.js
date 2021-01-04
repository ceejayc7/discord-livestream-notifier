import { BOT_COMMANDS } from '@root/constants';
import Discord from 'discord.js';
import { MoneyManager } from '@casino/moneymanager';
import _ from 'lodash';
import request from 'request-promise';
import { sendMessageToChannel } from '@root/util';

const TRIVIA_API = 'https://opentdb.com/api.php?amount=25&encode=url3986';
const TOKEN_API = 'https://opentdb.com/api_token.php?command=request';
const DATE_REGEX = /(Jan(uary)?|Feb(ruary)?|Mar(ch)?|Apr(il)?|May|Jun(e)?|Jul(y)?|Aug(ust)?|Sep(tember)?|Oct(ober)?|Nov(ember)?|Dec(ember)?)\s+\d{1,2},\s+\d{4}/g;

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
      token: null
    };
    this.event = event;
    this.init();
  }

  async init() {
    await this.fetchToken();
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
      const answer = this.decodeCurrentQuestion('correct_answer');
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

  decodeCurrentQuestion(key) {
    return decodeURIComponent(this.gameState.currentQuestion[key]);
  }

  sendNextQuestion() {
    this.completedQuestion();
    setTimeout(this.sendQuestion.bind(this), 10000);
  }

  getEmbedColorAndSetReward() {
    switch (this.decodeCurrentQuestion('difficulty')) {
      case 'easy':
        this.gameState.currentReward = 10;
        return '#66d9ff';
      case 'medium':
        this.gameState.currentReward = 50;
        return '#009933';
      case 'hard':
        this.gameState.currentReward = 100;
        return '#ff3300';
      default:
        this.gameState.currentReward = 10;
        return '#ffffff';
    }
  }

  createMessageEmbed() {
    const question = this.decodeCurrentQuestion('question');
    const color = this.getEmbedColorAndSetReward();
    return new Discord.MessageEmbed()
      .setColor(color)
      .setTitle(`${this.gameState.questionNumber}. ${question}`)
      .setDescription(this.decodeCurrentQuestion('category'));
  }

  getRevealedCharacters() {
    const answer = this.decodeCurrentQuestion('correct_answer').replace(' ', '');
    const length = Math.ceil(answer.length / 4);
    return _.sampleSize(answer, length);
  }

  hintCallback() {
    const answer = this.decodeCurrentQuestion('correct_answer');
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
        `Nobody got it. The correct answer was: **${this.decodeCurrentQuestion('correct_answer')}**`
      );
      this.sendNextQuestion();
    }
  }

  async setQuestion() {
    if (this.gameState.questions.length === 0) {
      await this.fetchQuestions();
    }
    this.gameState.currentQuestion = this.gameState.questions[0];

    while (
      this.decodeCurrentQuestion('type') === 'boolean' ||
      this.decodeCurrentQuestion('question').toLowerCase().includes('of the following') ||
      this.decodeCurrentQuestion('question').toLowerCase().includes('which of these') ||
      this.decodeCurrentQuestion('question').toLowerCase().includes('which one of these') ||
      this.decodeCurrentQuestion('question').toLowerCase().includes('magic: the gathering') ||
      DATE_REGEX.test(this.decodeCurrentQuestion('correct_answer'))
    ) {
      this.gameState.questions.shift();
      if (this.gameState.questions.length === 0) {
        await this.fetchQuestions();
      }
      this.gameState.currentQuestion = this.gameState.questions[0];
    }
    this.gameState.questionNumber = this.gameState.questionNumber + 1;
  }

  async sendQuestion() {
    if (!this.gameState.isGameStarted) {
      return;
    }
    await this.setQuestion();
    const question = this.createMessageEmbed();
    sendMessageToChannel(this.gameState.msg, question);
    // console.log(this.decodeCurrentQuestion('correct_answer'));
    this.startQuestionTimer();
  }

  async fetchToken() {
    const response = await this.networkRequest(TOKEN_API);
    if (response && response?.token) {
      this.gameState.token = response.token;
    }
  }

  async fetchQuestions() {
    const response = await this.networkRequest(`${TRIVIA_API}&token=${this.gameState.token}`);
    if (response && response?.results) {
      this.gameState.questions = response.results;
      return true;
    }
    return false;
  }

  async networkRequest(url) {
    const options = {
      url,
      json: true
    };

    try {
      return await request(options);
    } catch (err) {
      console.log('Unable to run network request');
      console.log(JSON.stringify(err));
    }
  }
}

export default Trivia;

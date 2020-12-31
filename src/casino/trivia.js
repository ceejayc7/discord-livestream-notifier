import Discord from 'discord.js';
import { MoneyManager } from '@casino/moneymanager';
import _ from 'lodash';
import request from 'request-promise';
import { sendMessageToChannel } from '@root/util';

const TRIVIA_API = 'https://opentdb.com/api.php?amount=25&encode=url3986';

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
      currentDifficulty: null
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
    this.clearQuestionTimer();
    this.gameState.questions.shift();
  }

  handleTriviaTimer() {
    clearTimeout(this.gameState.triviaTimer);
    this.gameState.triviaTimer = setTimeout(this.stopGame.bind(this), 120000);
  }

  stopGame() {
    sendMessageToChannel(this.gameState.msg, 'Ending trivia due to inactivity');
    this.event.emit('deleteTrivia', this.gameState.msg);
    this.removeChannelListener();
    this.gameState.isGameStarted = false;
    this.gameState.questions = [];
    this.gameState.currentQuestion = null;
    this.clearQuestionTimer();
    this.gameState.triviaTimer = null;
  }

  onMessage(msg) {
    if (
      msg.channel.name === this.gameState.channel &&
      msg.member.user.bot === false &&
      this.gameState.isGameStarted &&
      this.gameState.currentQuestion
    ) {
      this.handleTriviaTimer();
      const answer = this.decodeCurrentQuestion('correct_answer');
      if (msg.content.toLowerCase() === answer.toLowerCase()) {
        sendMessageToChannel(msg, `${msg.member.user} got it! The answer was: **${answer}**`);
        MoneyManager.addMoney(msg, this.currentReward);
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
    setTimeout(this.sendQuestion.bind(this), 5000);
  }

  getEmbedColorAndSetReward() {
    switch (this.decodeCurrentQuestion('difficulty')) {
      case 'easy':
        this.currentReward = 10;
        return '#66d9ff';
      case 'medium':
        this.currentReward = 50;
        return '#009933';
      case 'hard':
        this.currentReward = 100;
        return '#ff3300';
      default:
        this.currentReward = 10;
        return '#ffffff';
    }
  }

  createMessageEmbed() {
    let question = this.decodeCurrentQuestion('question');
    if (this.decodeCurrentQuestion('type') === 'boolean') {
      question = `[True or False] ${question}`;
    }
    const color = this.getEmbedColorAndSetReward();
    return new Discord.MessageEmbed()
      .setColor(color)
      .setTitle(question)
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

  async sendQuestion() {
    if (this.gameState.questions.length === 0) {
      await this.fetchQuestions();
    }
    this.gameState.currentQuestion = this.gameState.questions[0];
    const question = this.createMessageEmbed();
    sendMessageToChannel(this.gameState.msg, question);
    // console.log(this.decodeCurrentQuestion('correct_answer'));
    this.startQuestionTimer();
  }

  async fetchQuestions() {
    const options = {
      url: TRIVIA_API,
      json: true
    };

    try {
      const response = await request(options);
      if (response && response?.results) {
        this.gameState.questions = response.results;
        return true;
      }
    } catch (err) {
      console.log('Unable to fetch questions from trivia API');
      console.log(JSON.stringify(err));
    }
    return false;
  }
}

export default Trivia;

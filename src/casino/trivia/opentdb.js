import { fetchToken, networkRequest } from '@casino/trivia/network';

const SPECIAL_CHARACTERS_REGEX = /[^a-zA-Z\d\s]/g;

export class OpenTDB {
  constructor() {
    this.api = `https://opentdb.com/api.php?amount=50&encode=url3986`;
    this.token = null;
  }

  async setToken() {
    this.token = await fetchToken();
  }

  decodeCurrentQuestion(question, key) {
    return decodeURIComponent(question?.[key]);
  }

  decodeQuestions(questions) {
    return questions.map((question) => {
      return {
        category: this.decodeCurrentQuestion(question, 'category'),
        type: this.decodeCurrentQuestion(question, 'type'),
        difficulty: this.decodeCurrentQuestion(question, 'difficulty'),
        question: this.decodeCurrentQuestion(question, 'question'),
        correct_answer: this.decodeCurrentQuestion(question, 'correct_answer')
      };
    });
  }

  static filterQuestions(questions) {
    /* eslint-disable camelcase */
    const filtered = questions.filter((question) => {
      if (
        question?.type === 'boolean' ||
        question?.question.toLowerCase().includes('of the following') ||
        question?.question.toLowerCase().includes('which of these') ||
        question?.question.toLowerCase().includes('which one of these') ||
        question?.question.toLowerCase().includes('magic: the gathering') ||
        question?.question.toLowerCase().includes('which were not') ||
        question?.correct_answer.length > 30 ||
        question?.question.length > 256 ||
        SPECIAL_CHARACTERS_REGEX.test(question?.correct_answer)
      ) {
        return false;
      }
      return true;
    });
    return filtered;
  }

  async getQuestions() {
    const response = await networkRequest(`${this.api}&token=${this.token}`);
    if (response && response?.results) {
      const decodeQuestions = this.decodeQuestions(response.results);
      return OpenTDB.filterQuestions(decodeQuestions);
    }
    return [];
  }
}

import { fetchToken, networkRequest } from '@casino/trivia/network';
import { filterQuestions, removeArticles } from '@casino/trivia/filter';

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
        correct_answer: removeArticles(this.decodeCurrentQuestion(question, 'correct_answer'))
      };
    });
  }

  async getQuestions() {
    const response = await networkRequest(`${this.api}&token=${this.token}`);
    if (response && response?.results) {
      const decodeQuestions = this.decodeQuestions(response.results);
      return filterQuestions(decodeQuestions);
    }
    return [];
  }
}

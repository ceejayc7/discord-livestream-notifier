import { OpenTDB } from '@casino/trivia/opentdb';
import _ from 'lodash';
import { networkRequest } from '@casino/trivia/network';

const API = 'http://jservice.io/api/random?count=200';

const determineDifficulty = (number) => {
  if (number) {
    if (number > 0 && number < 400) {
      return 'easy';
    } else if (number > 400 && number < 700) {
      return 'medium';
    } else if (number > 700) {
      return 'hard';
    }
  }
  return 'medium';
};

const normalizeFormat = (questions) =>
  questions.map((question) => {
    return {
      category: `Jeopardy: ${_.startCase(_.toLower(question.category.title))}`,
      type: 'jeopardy',
      difficulty: determineDifficulty(question.value),
      question: question.question,
      correct_answer: question.answer
    };
  });

export const getQuestions = async () => {
  const response = await networkRequest(API);
  if (response && response.length) {
    const normalized = normalizeFormat(response);
    const filtered = OpenTDB.filterQuestions(normalized);
    return filtered;
  }
  return [];
};

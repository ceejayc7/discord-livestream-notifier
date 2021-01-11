import _ from 'lodash';

const SPECIAL_CHARACTERS_REGEX = /[^a-zA-Z\d\s]/g;

export const removeArticles = (answer) => {
  const lower = _.toLower(answer);
  console.log(lower);
  if (_.startsWith(lower, 'a ') || _.startsWith(lower, 'an ') || _.startsWith(lower, 'the ')) {
    return answer.substr(answer.indexOf(' ') + 1);
  }
  return answer;
};

export const filterQuestions = (questions) => {
  /* eslint-disable camelcase */
  const filtered = questions.filter((question) => {
    if (
      question?.type === 'boolean' ||
      question?.question.length === 0 ||
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
};

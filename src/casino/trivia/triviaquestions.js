import * as Jeopardy from '@casino/trivia/jeopardy';

import { OpenTDB } from '@casino/trivia/opentdb';
import _ from 'lodash';

const opentdb = new OpenTDB();

export const setToken = async () => {
  await opentdb.setToken();
};

export const getQuestions = async () => {
  try {
    let jeopardy = await Jeopardy.getQuestions();
    let otdb = await opentdb.getQuestions();

    jeopardy = _.take(jeopardy, 95);
    otdb = _.take(otdb, 5);

    return _.shuffle(_.concat(jeopardy, otdb));
  } catch (err) {
    return [];
  }
};

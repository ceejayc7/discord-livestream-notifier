/* eslint-disable camelcase */

import request from 'request-promise';

const TOKENS = require('@data/constants.json')?.tokens?.instagram;

export const getInstagramUserId = async (handle) => {
  const httpOptions = {
    url: `https://${TOKENS?.STORIES}/v1/get_user_id?username=${handle}`,
    headers: {
      'x-rapidapi-host': `${TOKENS?.STORIES}`,
      'x-rapidapi-key': `${TOKENS?.KEY}`
    },
    json: true
  };

  let result;
  try {
    result = await request(httpOptions);
    if (result?.status === 'Success') {
      return result?.user_id;
    }
  } catch (e) {
    console.log('Instagram: RapidAPI - Unable to get instagram user ID');
    console.log(JSON.stringify(e));
    console.log(JSON.stringify(result));
    return null;
  }
};

export const getInstagramStories = async (id) => {
  const httpOptions = {
    url: `https://${TOKENS?.STORIES}/v2/user_stories?userid=${id}`,
    headers: {
      'x-rapidapi-host': `${TOKENS?.STORIES}`,
      'x-rapidapi-key': `${TOKENS?.KEY}`
    },
    json: true
  };
  return request(httpOptions);
};

const getUserPostDataFromProxy = async (id, retryAttempt) => {
  if (retryAttempt === 4) {
    console.log(`Unable to get proxy data for id: ${id} after retryAttempt: ${retryAttempt}`);
    return null;
  }
  console.log('Instagram: Using RapidAPI');
  const httpOptions = {
    url: `https://${TOKENS?.HOST}/media-info-by-url?url=https://www.instagram.com/p/${id}`,
    headers: {
      'x-rapidapi-host': `${TOKENS?.HOST}`,
      'x-rapidapi-key': `${TOKENS?.KEY}`
    },
    json: true
  };
  let res;
  try {
    res = await request(httpOptions);
  } catch (e) {
    console.log(`Retry: ${retryAttempt}`);
    return getUserPostDataFromProxy(id, ++retryAttempt);
  }

  return res;
};

export const getUserPostData = async (id) => {
  const retryAttempt = 0;
  const httpOptions = {
    url: `https://instagram.com/p/${id}/?__a=1&__d=dis`,
    json: true
  };
  let result;

  try {
    result = await request(httpOptions);
    if (!result?.graphql) {
      return getUserPostDataFromProxy(id, retryAttempt);
    }
  } catch (e) {
    console.log(`Unable to retrieve user post data from id ${id}`);
    console.log(`Status Code: ${e?.statusCode}`);
    console.log(e?.error);

    return getUserPostDataFromProxy(id, retryAttempt);
  }

  return result?.graphql.shortcode_media;
};

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

export const getUserPostData = async (id) => {
  let httpOptions = {
    url: `https://instagram.com/p/${id}/?__a=1`,
    json: true
  };
  const result = await request(httpOptions);

  // main api throttled, try proxy
  if (!result?.graphql) {
    console.log('Instagram: Using RapidAPI');
    httpOptions = {
      url: `https://${TOKENS?.HOST}/post_details?shortcode=${encodeURIComponent(id)}`,
      headers: {
        'x-rapidapi-host': `${TOKENS?.HOST}`,
        'x-rapidapi-key': `${TOKENS?.KEY}`
      },
      json: true
    };
    const res = await request(httpOptions);
    if (!res?.body) {
      console.log(res);
    }
    return res?.body;
  }
  return result?.graphql.shortcode_media;
};

import request from 'request-promise';

const TOKEN_API = 'https://opentdb.com/api_token.php?command=request';

export const fetchToken = async () => {
  const response = await networkRequest(TOKEN_API);
  if (response && response?.token) {
    return response.token;
  }
};

export const networkRequest = async (url) => {
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
};

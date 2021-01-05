import _ from 'lodash';
import request from 'request-promise';
import { sendMessageToChannel } from '@root/util';

const endpoint = 'https://rest.coinapi.io/v1/exchangerate';
const CONSTANTS = require('@data/constants.json').tokens;

const getPriceObject = (prices, pair) => {
  return _.find(prices, (price) => price.asset_id_quote === pair);
};

const formatMessage = (price, coin) => {
  if (_.isEmpty(price)) {
    return '';
  }
  let rate = null;

  switch (price.asset_id_quote) {
    case 'USD':
      if (price.rate < 0.1) {
        rate = `$${price.rate}`;
      } else {
        rate = price.rate.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD'
        });
      }
      break;
    case 'BTC':
      rate = price.rate.toFixed(8);
      break;
    default:
      rate = price.rate;
      break;
  }
  return `> ${coin}/${price.asset_id_quote}: **${rate}** \n`;
};

const getMessageToSend = (coin, prices) => {
  let message = '';
  const usdPrice = getPriceObject(prices, 'USD');
  const btcPrice = getPriceObject(prices, 'BTC');

  message += formatMessage(usdPrice, coin);
  message += formatMessage(btcPrice, coin);

  return message.slice(0, -1);
};

export const getCryptocurrencyPrice = async (msg) => {
  const key = CONSTANTS?.crypto?.coinapi;
  const coin = _.upperCase(msg.content.substring(1));

  if (!key) {
    console.log(`[Crypto] No API key defined in data/constants.json`);
    return;
  }

  const requestOptions = {
    url: `${endpoint}/${coin}`,
    json: true,
    method: 'GET',
    headers: {
      'X-CoinAPI-Key': key
    }
  };

  try {
    const response = await request(requestOptions);
    const rates = response.rates.filter(
      (price) => price.asset_id_quote === 'USD' || price.asset_id_quote === 'BTC'
    );

    if (rates.length) {
      const message = getMessageToSend(coin, rates);
      sendMessageToChannel(msg, message);
    } else {
      console.log(`[Crypto]: No rates for ${coin}`);
    }
  } catch (err) {
    console.log(`[Crypto]: Unable to send price`);
    console.log(JSON.stringify(err));
  }
};

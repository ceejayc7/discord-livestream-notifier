import _ from 'lodash';
import request from 'request-promise';
import { sendMessageToChannel } from '@root/util';

const endpoint = 'https://rest.coinapi.io/v1/exchangerate'
const CONSTANTS = require('@data/constants.json').tokens;

const getMessageToSend = (coin, prices) => {
  let message = '';
  let rate = null;
  
  for(const price of prices) {
    if(price.asset_id_quote === "USD") {
      rate = price.rate.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
      });
    }
    else {
      rate = price.rate;
    }
    message += `> ${coin}/${price.asset_id_quote}: **${rate}** \n`;
  }
  return message.slice(0,-1);
}

export const getCryptocurrencyPrice = async (msg) => {
  const key = CONSTANTS?.crypto?.coinapi;
  const coin = _.upperCase(msg.content.substring(1));

  if(!key) {
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
    const rates = response.rates.filter((price) => price.asset_id_quote === 'USD' || price.asset_id_quote === 'BTC');
    
    if(rates.length) {
      const message = getMessageToSend(coin, rates);
      sendMessageToChannel(msg, message);
    }
    else {
      console.log(`[Crypto]: No rates for ${coin}`);
    }
  }
  catch (err) {
    console.log(`[Crypto]: Unable to send price`);
    console.log(JSON.stringify(err));
  }
}

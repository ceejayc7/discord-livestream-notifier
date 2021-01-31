import Discord from 'discord.js';
import _ from 'lodash';
import request from 'request-promise';
import { sendMessageToChannel } from '@root/util';

const endpoint = 'https://rest.coinapi.io/v1';
const CONSTANTS = require('@data/constants.json').tokens;
const key = CONSTANTS?.crypto?.coinapi;
let assetMap = [];
let assetIcons = [];

const runRequest = async (requestOptions) => {
  try {
    return await request(requestOptions);
  } catch (err) {
    console.log(`[Crypto]: Unable to fetch data`);
    console.log(JSON.stringify(err));
    console.log(requestOptions);
    return [];
  }
};

const setAssetMap = async () => {
  const requestOptions = {
    url: `${endpoint}/assets`,
    json: true,
    method: 'GET',
    headers: {
      'X-CoinAPI-Key': key
    }
  };

  assetMap = await runRequest(requestOptions);
};

const setAssetIcons = async () => {
  const requestOptions = {
    url: `${endpoint}/assets/icons/512`,
    json: true,
    method: 'GET',
    headers: {
      'X-CoinAPI-Key': key
    }
  };

  assetIcons = await runRequest(requestOptions);
};

export const onBotStart = () => {
  setAssetMap();
  setAssetIcons();
};

const getPricingData = async (coin) => {
  const requestOptions = {
    url: `${endpoint}/exchangerate/${coin}`,
    json: true,
    method: 'GET',
    headers: {
      'X-CoinAPI-Key': key
    }
  };

  const response = await runRequest(requestOptions);
  return response.rates.filter(
    (price) => price.asset_id_quote === 'USD' || price.asset_id_quote === 'BTC'
  );
};

const findCoin = (data, coin) => {
  return data.find((asset) => asset.asset_id === coin);
};

const formatRates = (rates) => {
  const formatted = {};
  for (const price of rates) {
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
    formatted[price.asset_id_quote] = { rate, timestamp: price.time };
  }
  return formatted;
};

const createEmbed = (formattedRates, coin) => {
  const assetData = findCoin(assetMap, coin);
  const icons = findCoin(assetIcons, coin);

  const embed = new Discord.MessageEmbed()
    .setColor('#FFD85F')
    .setTimestamp(formattedRates['USD'].timestamp);

  if (!_.isEmpty(icons)) {
    embed.setThumbnail(icons.url);
  }

  if (_.isEmpty(assetData)) {
    embed.setTitle(coin);
  } else {
    embed.setTitle(`${assetData.name}`);
  }

  let description = `Current Price: **${formattedRates['USD'].rate}**`;

  if (coin !== 'BTC') {
    description = `${description}\n${coin}/BTC: **${formattedRates['BTC'].rate}**`;
  }

  embed.setDescription(description);

  return embed;
};

export const getCryptocurrencyPrice = async (msg) => {
  const coin = _.upperCase(msg.content.substring(1));

  if (!key) {
    console.log(`[Crypto] No API key defined in data/constants.json`);
    return;
  }

  const rates = await getPricingData(coin);
  const formattedRates = formatRates(rates);

  const embed = createEmbed(formattedRates, coin);
  sendMessageToChannel(msg, embed);
};

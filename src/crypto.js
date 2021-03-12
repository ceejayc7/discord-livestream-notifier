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

export const onBotStart = async () => {
  await setAssetMap();
  await setAssetIcons();
};

const getOHLCV = async (coin) => {
  const requestOptions = {
    url: `${endpoint}/ohlcv/${coin}/USD/latest?period_id=1DAY`,
    json: true,
    method: 'GET',
    headers: {
      'X-CoinAPI-Key': key
    }
  };

  return await runRequest(requestOptions);
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
  if (!_.isEmpty(response)) {
    return response.rates.filter(
      (price) => price.asset_id_quote === 'USD' || price.asset_id_quote === 'BTC'
    );
  }
  return [];
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

const createEmbed = (formattedRates, coin, dailyChange) => {
  const assetData = findCoin(assetMap, coin);
  const icons = findCoin(assetIcons, coin);

  const embed = new Discord.MessageEmbed()
    .setColor('#FFD85F')
    .setTimestamp(formattedRates['USD'].timestamp);

  if (!_.isEmpty(icons)) {
    embed.setThumbnail(icons.url);
  }

  if (!_.isEmpty(assetData) && assetData?.name) {
    embed.setTitle(`${assetData.name}`);
  } else {
    embed.setTitle(coin);
  }

  let description = `Current Price: **${formattedRates['USD'].rate}**`;

  if (coin !== 'BTC') {
    description = `${description}\n${coin}/BTC: **${formattedRates['BTC'].rate}**`;
  }

  if (!_.isEmpty(dailyChange)) {
    description = `${description}\nPercent Change: \`\`\`diff\n${dailyChange}\n\`\`\``;
  }

  embed.setDescription(description);
  return embed;
};

const calculateDailyChange = (ohlcv) => {
  /* eslint-disable camelcase */
  if (!ohlcv?.price_close || !ohlcv?.price_open) {
    return false;
  }
  const calc = parseFloat(((ohlcv.price_close - ohlcv.price_open) / ohlcv.price_open) * 100);
  if (calc > 0) {
    return `+${calc.toFixed(2)}%`;
  }
  return `${calc.toFixed(2)}%`;
};

export const getCryptocurrencyPrice = async (msg) => {
  const coin = _.upperCase(msg.content.substring(1));

  if (!key) {
    console.log(`[Crypto] No API key defined in data/constants.json`);
    return;
  }

  const rates = await getPricingData(coin);
  if (_.isEmpty(rates)) {
    console.log(`Unable to get rates for ${coin}`);
    return;
  }

  const ohlcv = await getOHLCV(coin);
  const formattedRates = formatRates(rates);
  const dailyChange = calculateDailyChange(_.head(ohlcv));

  const embed = createEmbed(formattedRates, coin, dailyChange);
  sendMessageToChannel(msg, embed);
};

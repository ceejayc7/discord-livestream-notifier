import { default as CONSTANTS } from '@data/constants.json';
import _ from 'lodash';

const getWebhookNameFromServer = (msg) => {
  return CONSTANTS?.serverConfig?.[msg?.guild?.name]?.kpopWebhookName;
};

const parseWebhookList = (webhooks, name) => {
  return webhooks.find((hook) => hook.name === name);
};

export const getWebhook = async (msg) => {
  const webhookName = getWebhookNameFromServer(msg);
  if (_.isEmpty(webhookName)) {
    return null;
  }
  const webhooks = await msg.channel.fetchWebhooks();
  return parseWebhookList(webhooks, webhookName);
};

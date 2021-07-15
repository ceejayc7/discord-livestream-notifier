import Discord from 'discord.js';
import _ from 'lodash';
import { getWebhook } from '@root/webhook';
import request from 'request-promise';
import { sendMessageToChannel } from '@root/util';

const INSTAGRAM_REGEX = /instagram\.com\/(p|tv)\/(.*)/;

export const doesMsgContainInstagram = (msg) => INSTAGRAM_REGEX.test(msg.content);

const getInstagramId = (msg) => {
  const match = INSTAGRAM_REGEX.exec(msg.content);
  if (match && match.length > 2) {
    let id = match[2];
    if (id.includes('?')) {
      id = id.substring(0, id.indexOf('?'));
    }
    id = id.replace('/', '');
    return id;
  }
  return '';
};

const fetchApiData = (id) => {
  const httpOptions = {
    url: `https://instagram.com/p/${id}/?__a=1`,
    json: true
  };
  return request(httpOptions);
};

const parseApiData = (apiData) => {
  const videos = [];
  const pictures = [];
  const edges = _.get(apiData, 'graphql.shortcode_media.edge_sidecar_to_children.edges', []);
  for (const edge of edges) {
    edge.node.is_video ? videos.push(edge.node.video_url) : pictures.push(edge.node.display_url);
  }

  // singular video/picture post
  if (_.isEmpty(edges)) {
    apiData.graphql.shortcode_media.is_video
      ? videos.push(apiData.graphql.shortcode_media.video_url)
      : pictures.push(apiData.graphql.shortcode_media.display_url);
  }

  let text = _.get(apiData, 'graphql.shortcode_media.edge_media_to_caption.edges');
  if (!_.isEmpty(text)) {
    text = _.get(text[0], 'node.text');
  } else {
    text = '';
  }

  return {
    name: apiData.graphql.shortcode_media.owner.full_name,
    username: apiData.graphql.shortcode_media.owner.username,
    text,
    videos,
    pictures,
    timestamp: apiData.graphql.shortcode_media.taken_at_timestamp * 1000,
    avatar: apiData.graphql.shortcode_media.owner.profile_pic_url
  };
};

export const sendInstagramEmbeds = async (msg) => {
  const webhook = await getWebhook(msg);
  if (_.isEmpty(webhook)) {
    return;
  }
  const id = getInstagramId(msg);
  if (!_.isEmpty(id)) {
    try {
      const data = await fetchApiData(id);
      const media = parseApiData(data);
      const embeds = getImageEmbeds(id, media);
      sendMediaToChannel(msg, media, embeds, webhook);
    } catch (err) {
      console.log(`Couldnt send Instagram embeds from ${msg.content}`);
      console.log(err);
    }
  }
};

const getTitle = (media) => media.text.substring(0, 255);

const createImageEmbed = (title, author, timestamp, id, url, avatar) => {
  return new Discord.MessageEmbed()
    .setImage(url)
    .setColor('#e91129')
    .setURL('https://twitter.com')
    .setTitle(title)
    .setAuthor(author, avatar)
    .setTimestamp(timestamp)
    .setFooter('Instagram', 'https://i.imgur.com/1EybaiS.png')
    .setURL(`https://instagram.com/p/${id}/`);
};

const getImageEmbeds = (id, media) => {
  const title = getTitle(media);
  const author = `${media.name + ' (' + media.username + ')'}`;
  const timestamp = media.timestamp;
  const avatar = media.avatar;
  return media.pictures.map((url) => createImageEmbed(title, author, timestamp, id, url, avatar));
};

const sendMediaToChannel = async (msg, media, embeds, webhook) => {
  let fourEmbeds = [];
  if (_.isEmpty(embeds)) {
    sendMessageToChannel(msg, getTitle(media));
  } else {
    for (const [index, embed] of embeds.entries()) {
      fourEmbeds.push(embed);
      if ((index + 1) % 4 === 0) {
        await webhook.send(fourEmbeds);
        fourEmbeds = [];
      }
    }
    if (!_.isEmpty(fourEmbeds)) {
      await webhook.send(fourEmbeds);
    }
  }
  if (media.videos.length) {
    media.videos.map((videoURL) => sendMessageToChannel(msg, videoURL));
  }

  // sometimes the official discord ig embed doesnt show until later
  // not sure why
  // just wait 2 seconds and try to suppress it again
  // await wait(2000);
  // msg.suppressEmbeds(true);
};

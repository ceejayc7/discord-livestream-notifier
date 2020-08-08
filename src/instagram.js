import { sendMessageToChannel, wait } from '@root/util';

import Discord from 'discord.js';
import _ from 'lodash';
import request from 'request-promise';

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
  const id = getInstagramId(msg);
  if (!_.isEmpty(id)) {
    try {
      const data = await fetchApiData(id);
      const media = parseApiData(data);
      const embeds = getImageEmbeds(media);
      sendMediaToChannel(msg, id, media, embeds);
    } catch (err) {
      console.log(`Couldnt send Instagram embeds from ${msg.content}`);
      console.log(err);
    }
  }
};

const createImageEmbed = (url) => new Discord.MessageEmbed().setImage(url).setColor('#e91129');

const getImageEmbeds = (media) => media.pictures.map(createImageEmbed);

export const sendMediaToChannel = async (msg, id, media, embeds) => {
  let title = `${media.name} on Instagram${!_.isEmpty(media.text) ? ': ' + media.text : ''}`;
  const author = `${media.name + ' (' + media.username + ')'}`;

  title = title.substring(0, 255);

  if (_.isEmpty(embeds)) {
    sendMessageToChannel(msg, title);
  } else {
    _.first(embeds)
      .setTitle(title)
      .setAuthor(author, 'https://i.imgur.com/1EybaiS.png')
      .setTimestamp(media.timestamp)
      .setURL(`https://instagram.com/p/${id}/`)
      .setThumbnail(media.avatar);

    embeds.map((embed) => sendMessageToChannel(msg, embed).then(msg.suppressEmbeds(true)));
  }
  if (media.videos.length) {
    media.videos.map((videoURL) => sendMessageToChannel(msg, videoURL));
  }

  // sometimes the official discord ig embed doesnt show until later
  // not sure why
  // just wait 2 seconds and try to suppress it again
  await wait(2000);
  msg.suppressEmbeds(true);
};

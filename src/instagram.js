import Discord from 'discord.js';
import _ from 'lodash';
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
    text,
    videos,
    pictures
  };
};

export const sendInstagramEmbeds = async (msg) => {
  const id = getInstagramId(msg);
  if (!_.isEmpty(id)) {
    try {
      const data = await fetchApiData(id);
      const media = parseApiData(data);
      console.log(media);
      const embeds = getImageEmbeds(media);
      sendMediaToChannel(msg, media, embeds);
    } catch (err) {
      console.log(`Couldnt send Instagram embeds from ${msg.content}`);
      console.log(err);
    }
  }
};

const createImageEmbed = (url) => new Discord.MessageEmbed().setImage(url).setColor('#e91129');

const getImageEmbeds = (media) => media.pictures.map(createImageEmbed);

export const sendMediaToChannel = (msg, media, embeds) => {
  const description = `${media.name} on Instagram${
    !_.isEmpty(media.text) ? ': ' + media.text : ''
  }`;

  sendMessageToChannel(msg, description);
  embeds.map((embed) => sendMessageToChannel(msg, embed));
  media.videos.map((videoURL) => sendMessageToChannel(msg, videoURL));
};

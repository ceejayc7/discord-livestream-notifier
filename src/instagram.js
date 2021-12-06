/* eslint-disable camelcase */

import { getInstagramStories, getInstagramUserId, getUserPostData } from '@root/request/instagram';

import Discord from 'discord.js';
import _ from 'lodash';
import { getWebhook } from '@root/webhook';
import { sendMessageToChannel } from '@root/util';

const INSTAGRAM_REGEX = /instagram\.com(?:\/.*)?\/(?:p|tv)\/(.*)/;
const INSTAGRAM_STORIES_REGEX = /instagram\.com\/(?:stories)\/(.*?)\/(.*)/;

export const doesMsgContainInstagramPost = (msg) => INSTAGRAM_REGEX.test(msg.content);

export const doesMsgContainInstagramStory = (msg) => INSTAGRAM_STORIES_REGEX.test(msg.content);

const massageStoryResponse = (stories, handle) => {
  const avatar = stories?.profilePic;
  const videos = [];
  const pictures = [];
  stories?.downloadLinks.map((story) => {
    const link = story?.url;
    if (!link) {
      return;
    }
    switch (story?.mediaType) {
      case 'video':
        videos.push(link);
        break;
      case 'image':
        pictures.push(link);
        break;
      default:
        break;
    }
  });
  return {
    name: '',
    username: handle,
    text: '',
    videos,
    pictures,
    timestamp: 0,
    avatar,
    type: 'story'
  };
};

export const sendInstagramStory = async (msg) => {
  const handle = getInstagramId(msg, INSTAGRAM_STORIES_REGEX);
  try {
    const webhook = await getWebhook(msg);
    if (_.isEmpty(webhook)) {
      return;
    }

    const id = await getInstagramUserId(handle);
    const stories = await getInstagramStories(id);
    const media = massageStoryResponse(stories, handle);
    const embeds = getImageEmbeds(id, media);
    sendMediaToChannel(msg, media, embeds, webhook);
  } catch (err) {
    console.log(`Unable to send IG story for ${handle}`);
    console.log(JSON.stringify(err));
  }
};

const getInstagramId = (msg, regex) => {
  const match = regex.exec(msg.content);
  if (match && match.length > 1) {
    let id = match[1];
    if (id.includes('?')) {
      id = id.substring(0, id.indexOf('?'));
    }
    id = id.replace('/', '');
    return id;
  }
  return '';
};

const parseUserPostData = (apiData) => {
  const videos = [];
  const pictures = [];
  const edges = apiData?.edge_sidecar_to_children?.edges ?? [];
  for (const edge of edges) {
    edge.node.is_video ? videos.push(edge.node.video_url) : pictures.push(edge.node.display_url);
  }

  // singular video/picture post
  if (_.isEmpty(edges)) {
    apiData.is_video ? videos.push(apiData.video_url) : pictures.push(apiData.display_url);
  }

  let text = apiData?.edge_media_to_caption?.edges ?? [];
  if (!_.isEmpty(text)) {
    text = text?.[0]?.node?.text;
  } else {
    text = '';
  }

  return {
    name: apiData.owner.full_name,
    username: apiData.owner.username,
    text,
    videos,
    pictures,
    timestamp: apiData.taken_at_timestamp * 1000,
    avatar: apiData.owner.profile_pic_url,
    type: 'post'
  };
};

export const sendInstagramEmbeds = async (msg) => {
  const webhook = await getWebhook(msg);
  if (_.isEmpty(webhook)) {
    return;
  }
  const id = getInstagramId(msg, INSTAGRAM_REGEX);
  if (!_.isEmpty(id)) {
    try {
      const data = await getUserPostData(id);
      const media = parseUserPostData(data);
      const embeds = getImageEmbeds(id, media);
      sendMediaToChannel(msg, media, embeds, webhook);
    } catch (err) {
      console.log(`Couldnt send Instagram embeds from ${msg.content}`);
      console.log(err);
    }
  }
};

const getTitle = (media) => media?.text.substring(0, 255);

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

const getAuthor = (media) => {
  switch (media.type) {
    case 'post':
      return `${media?.name + ' (' + media?.username + ')'}`;
    case 'story':
      return media?.username;
    default:
      return '';
  }
};

const getImageEmbeds = (id, media) => {
  const title = getTitle(media);
  const author = getAuthor(media);
  const timestamp = media?.timestamp;
  const avatar = media?.avatar;
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
};

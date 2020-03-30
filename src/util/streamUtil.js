import _ from 'lodash';

export const addQueryParamToList = (queryParam, listOfStreams) => {
  const newList = [];
  listOfStreams.forEach((stream) => newList.push(`&${queryParam}=${stream}`));
  return newList;
};

export const apiError = (platform, error) => {
  console.log(
    `${platform} API error. \t Error name: ${error.name} \t Error message: ${error.message}`
  );
};

export const getListOfStreams = (streamSite) => {
  const streamsDatabase = require('@data/db.json');
  return _.uniq(_.compact(_.flatten(_.map(streamsDatabase, streamSite))));
};

export const retrieveLiveChannels = (className, channelData) => {
  if (!_.isEmpty(channelData)) {
    _.forEach(channelData, (stream) => className.announceIfStreamIsNew(stream));
  }
  className.currentLiveStreams = channelData;
};

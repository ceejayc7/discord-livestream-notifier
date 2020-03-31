export const addQueryParamToList = (queryParam, listOfStreams) => {
  const newList = [];
  listOfStreams.forEach((stream) => newList.push(`&${queryParam}=${stream}`));
  return newList;
};

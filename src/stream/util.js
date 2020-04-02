export const addQueryParamToList = (queryParam, listOfStreams) =>
  listOfStreams.map((stream) => `&${queryParam}=${stream}`);

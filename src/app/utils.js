import $ from 'jquery';
import _ from 'lodash';
import getLogger from 'webpack-log';

const logger = getLogger({ name: 'application', level: 'debug' });

const log = (...params) => logger.debug(...params);

const logError = (...params) => logger.error(...params);

const getPostsList = (state, feedUrl = '') => {
  if (!state || !state.listFeedsData) {
    return [];
  }
  const allPosts = state.listFeedsData
    .reduce((posts, feed) => [...posts, ...feed.posts], []);
  if (!feedUrl) {
    return allPosts;
  }
  return allPosts.filter((post) => post.feedUrl === feedUrl);
};

const getPostByLink = (state, link) => {
  const list = getPostsList(state);
  log('getPostByLink, list:', list);
  return _.find(list, { link });
};

const parsePost = (feedUrl, data) => {
  const link = $(data).find('link');
  const title = $(data).find('title');
  const description = $(data).find('description');
  if (link.length === 0 || title.length === 0) {
    throw new Error('link or title not found');
  }
  return {
    feedUrl,
    link: link.text(),
    title: title.text(),
    description: description.text(),
  };
};

const getRSSData = (link, data) => {
  const domParser = new DOMParser();
  const parsedData = domParser.parseFromString(data, 'text/xml');
  const title = $(parsedData).find('rss > channel > title');
  const description = $(parsedData).find('rss > channel > description');
  if (title.length === 0 || description.length === 0) {
    const errorMessage = 'not found title or description';
    logError(errorMessage);
    throw new Error(errorMessage);
  }
  const dataPosts = $(parsedData).find('item').toArray();
  const posts = dataPosts.map((item) => parsePost(link, item));
  return {
    link,
    title: title.text(),
    description: description.text(),
    posts,
  };
};

export { getPostsList, getPostByLink, getRSSData };

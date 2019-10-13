import _ from 'lodash';
import getLogger from 'webpack-log';

const logger = getLogger({ name: 'utils', level: 'debug' });

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
  const link = data.querySelector('link');
  const title = data.querySelector('title');
  const description = data.querySelector('description');
  if (link.length === 0 || title.length === 0) {
    throw new Error('link or title not found');
  }
  return {
    feedUrl,
    link: link.textContent,
    title: title.textContent,
    description: description.textContent,
  };
};

const getRSSData = (link, data) => {
  const domParser = new DOMParser();
  const parsedData = domParser.parseFromString(data, 'text/xml');
  const title = parsedData.querySelector('rss > channel > title');
  const description = parsedData.querySelector('rss > channel > description');
  if (title.length === 0 || description.length === 0) {
    const errorMessage = 'not found title or description';
    logError(errorMessage);
    throw new Error(errorMessage);
  }
  const dataPosts = Array.from(parsedData.querySelectorAll('item'));
  const posts = dataPosts.map((item) => parsePost(link, item));
  return {
    link,
    title: title.textContent,
    description: description.textContent,
    posts,
  };
};

const getFeedUrl = (link) => {
  const proxy = process.env.CORS_PROXY_URL;
  log('proxy:', proxy);
  if (proxy) {
    return `${proxy}/${link}`;
  }
  return link;
};

export {
  getPostsList,
  getPostByLink,
  getRSSData,
  getFeedUrl,
};

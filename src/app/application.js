/* global Exception */
import getLogger from 'webpack-log';
import WatchJS from 'melanke-watchjs';
import $ from 'jquery';
import _ from 'lodash';

const logger = getLogger({ name: 'application', level: 'debug' });

export default class Application {
  constructor() {
    this.validators = [];
    this.currentRssUrl = '';
    this.data = {
      links: [],
      listFeedsData: [],
      posts: [],
    };
  }

  log(...params) { // eslint-disable-line class-methods-use-this
    logger.debug(...params);
  }

  logError(...params) { // eslint-disable-line class-methods-use-this
    logger.error(...params);
  }

  init() {
    WatchJS.watch(this.data, 'listFeedsData', () => {
      const feedListHtml = this.getFeedListHtml(this.data.listFeedsData);
      $('#feed-list').html(feedListHtml);
    });

    WatchJS.watch(this.data, ['posts'], () => {
      const linksPosts = this.data.posts.reduce((html, item) => `${html}${this.getLinkPost(item)}`, '');
      $('#posts-list').html(linksPosts);
    });
  }

  getFeedList() { // eslint-disable-line class-methods-use-this
    return JSON.parse(JSON.stringify(this.data.listFeedsData));
  }

  isAlreadyHasLink(link) {
    return _.some(this.data.links, { link });
  }

  removeLink(link) {
    this.data.links = this.data.links.filter((item) => item === link);
  }

  getFeedDataByLink(link) {
    const list = this.getFeedList();
    this.log('list:', list);
    return _.find(list, { link });
  }

  getFeedListHtml(list) {
    return list.reduce((html, item) => `${html}${this.getFeedHtml(item)}`, '');
  }

  getFeedHtml(feedData) { // eslint-disable-line class-methods-use-this
    return `<tr>
      <td>${feedData.title}</td>
      <td>${feedData.description}</td>
    </tr>`;
  }

  getLinkPost(postData) { // eslint-disable-line class-methods-use-this
    this.log('postData:', postData);
    return `<li><a href=${postData.link}>${postData.title}</a></li>`;
  }

  getPostData(data) { // eslint-disable-line class-methods-use-this
    const link = $(data).find('link');
    const title = $(data).find('title');
    if (link.length === 0 || link.length === 0) {
      throw new Exception('Ошибка');
    }
    return {
      link: link.text(),
      title: title.text(),
    };
  }

  setPosts(posts) {
    this.data.posts = posts;
  }

  addValidator(validator) {
    this.validators = [...this.validators, validator];
  }

  validateLink(link) { // eslint-disable-line class-methods-use-this
    const result = this.validators.reduce((carry, currentValidator) => {
      const currentResult = currentValidator(link);
      if (currentResult === false) {
        return false;
      }
      return carry;
    }, true);
    this.log('Validator result:', result);
    return result;
  }

  setNewLink(link) {
    this.currentRssUrl = link;
  }

  addLinkRss(link) {
    const list = this.getFeedList();
    const newFeedData = {
      number: list.length + 1,
      link,
    };
    this.data.links = [...this.data.links, newFeedData];
  }

  updateRss(link, data) {
    const title = $(data).find('rss > channel > title');
    const description = $(data).find('rss > channel > description');
    if (title.length === 0 || description.length === 0) {
      this.logError('not found title or description');
      return false;
    }
    const newFeedData = {
      link,
      title: title.text(),
      description: description.text(),
    };
    this.log('update:', newFeedData);
    this.data.listFeedsData = [
      ...this.data.listFeedsData.filter((item) => item.link === link),
      newFeedData,
    ];
    return true;
  }
}

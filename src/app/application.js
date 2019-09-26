/* global Exception */
import getLogger from 'webpack-log';
import WatchJS from 'melanke-watchjs';
import $ from 'jquery';
import _ from 'lodash';
import url from 'url';

const logger = getLogger({ name: 'application', level: 'debug' });

export default class Application {
  constructor(network, rssParser) {
    this.network = network;
    this.rssParser = rssParser;
    this.validators = [];
    this.currentRssUrl = '';
    this.data = {
      links: [],
      listFeedsData: [],
      posts: [],
      modalState: {
        open: false,
        postLink: '',
      },
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

    WatchJS.watch(this.data, 'posts', () => {
      const linksPosts = this.data.posts.reduce((html, item) => `${html}${this.getLinkPost(item)}`, '');
      $('#posts-list').html(linksPosts);
    });

    WatchJS.watch(this.data.modalState, 'open', () => {
      const { open, postLink } = this.data.modalState;
      if (open) {
        const post = this.getPostByLink(postLink);
        $('#modal-post-label').text(post.link);
        $('.modal-body').text(post.description);
        $('#modal-post').modal({ show: true });
      } else {
        $('#modal-post').modal({ show: false });
      }
    });
  }

  getFeedList() { // eslint-disable-line class-methods-use-this
    return JSON.parse(JSON.stringify(this.data.listFeedsData));
  }

  hasAlreadyLink(link) {
    return _.some(this.data.links, { link });
  }

  removeLink(link) {
    this.data.links = this.data.links.filter((item) => item === link);
  }

  getPostByLink(link) {
    const list = this.getFeedList();
    return _.find(list, { link });
  }

  getFeedListHtml(list) {
    return list.reduce((html, item) => `${html}${this.getFeedHtml(item)}`, '');
  }

  getFeedHtml(post) { // eslint-disable-line class-methods-use-this
    const postData = $(`<tr>
      <td>${post.title}</td>
      <td>${post.description}</td>
    </tr>`);
    const openPostButton = $(`<button data-link="${post.link}">Открыть</button>`);
    openPostButton.on('click', () => {
      const modalState = {
        open: true,
        postLink: post.link,
      };
      this.data.modalState = modalState;
    });
    postData.append(openPostButton);
    return post.html();
  }

  getLinkPost(postData) { // eslint-disable-line class-methods-use-this
    this.log('postData:', postData);
    return `<li><a href=${postData.link}>${postData.title}</a></li>`;
  }

  getPostData(data) { // eslint-disable-line class-methods-use-this
    const link = $(data).find('link');
    const title = $(data).find('title');
    const description = $(data).find('description');
    if (link.length === 0 || link.length === 0) {
      throw new Exception('Ошибка');
    }
    return {
      link: link.text(),
      title: title.text(),
      description: description.text(),
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

  addLinkRss(link, proxy = '') {
    const list = this.getFeedList();
    const newFeedData = {
      number: list.length + 1,
      link,
    };
    this.data.links = [...this.data.links, newFeedData];
    const currentLink = this.getLink(link, proxy);
    return this.network.get(currentLink)
      .then((response) => {
        this.log('dataRSS:', response);
        const { data } = response;
        const parsedData = this.rssParser(data);
        this.log('parsedDataPosts:', parsedData);
        this.updateRss(link, parsedData);
        const dataPosts = $(parsedData).find('item').toArray();
        const posts = dataPosts.map((item) => this.getPostData(item));
        this.setPosts(posts);
      })
      .catch((error) => {
        $('.toast-body').text('Произошла ошибка');
        $('.toast').toast('show');
        this.removeLink(link);
        this.log(error);
      });
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

  getLink(link, proxy = '') { // eslint-disable-line class-methods-use-this
    const urlParsed = url.parse(link);
    const { host, path } = urlParsed;
    const linkRss = `${host}${path}`;
    this.log('linkRss:', linkRss);
    const currentLink = proxy ? url.resolve(proxy, linkRss) : link;
    return currentLink;
  }
}

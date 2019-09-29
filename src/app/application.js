/* global Exception document */
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
      const linksPosts = this.data.posts.reduce((html, item) => `${html}${this.getLinkPostHtml(item)}`, '');
      $('#posts-list').html(linksPosts);
    });

    WatchJS.watch(this.data.modalState, 'open', () => {
      const { open, postLink } = this.data.modalState;
      this.log('Open modal, postLink:', postLink);
      if (open) {
        const post = this.getPostByLink(postLink);
        this.log('Open modal, post:', post);
        $('#modal-post-label').text(post.link);
        $('.modal-body').text(post.description);
        $('#modal-post').modal({ show: true });
      } else {
        $('#modal-post').modal({ show: false });
      }
    });
  }

  bindActions() {
    $(document).on('change', 'input', (event) => this.onInput(event));

    $(document).on('mouseup', '#add-rss', () => this.onAddRss());

    $(document).on('mouseup', '.open-post', (event) => this.onOpenPost(event));

    $('#modal-post').on('hidden.bs.modal', () => {
      this.data.modalState.open = false;
    });
  }

  destroy() { // eslint-disable-line class-methods-use-this
    $(document).off('change', 'input');

    $(document).off('mouseup', '#add-rss');

    $(document).off('mouseup', '.open-post');
  }

  onOpenPost(event) {
    this.log('Open post!');
    const element = $(event.currentTarget);
    const link = element.data('link');
    this.setOpenLinkPost(link);
    this.openModal();
  }

  onAddRss() {
    const link = this.currentRssUrl;
    if (!this.validateLink(link)) {
      return;
    }
    this.addLinkRss(link)
      .then(() => {
        $('input').val('');
      });
  }

  onInput(event) {
    const link = event.currentTarget.value;
    this.log('link:', link);
    const currentLink = this.getCurrentLink(link);
    this.log('currentLInk:', currentLink);
    const isCurrentLink = this.validateLink(link);
    if (isCurrentLink) {
      this.setNewLink(link);
      $(event.currentTarget).removeClass('is-invalid');
    } else {
      $(event.currentTarget).addClass('is-invalid');
    }
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
    const list = this.getPostsList();
    this.log('getPostByLink, list:', list);
    return _.find(list, { link });
  }

  getFeedListHtml(list) {
    return list.reduce((html, item) => `${html}${this.getFeedHtml(item)}`, '');
  }

  getFeedHtml(feed) { // eslint-disable-line class-methods-use-this
    const feedHtml = $(`<tr>
      <td>${feed.title}</td>
      <td>${feed.description}</td>
    </tr>`);
    return feedHtml.html();
  }

  getLinkPostHtml(post) { // eslint-disable-line class-methods-use-this
    this.log('postData:', post);
    return `<div class="row pl-5 mb-2">
        <a href=${post.link} class="col-6 col-md-2 p-1">${post.title}</a>
        <button class="open-post btn btn-primary btn-sm" data-link="${post.link}">Читать</button>
      </div>`;
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
    this.data.posts = [...this.data.posts, ...posts];
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

  setOpenLinkPost(link) {
    this.data.modalState.postLink = link;
  }

  getPostsList() {
    return this.data.posts;
  }

  openModal() {
    this.data.modalState.open = true;
  }

  getLink(link, proxy = '') { // eslint-disable-line class-methods-use-this
    const urlParsed = url.parse(link);
    const { host, path } = urlParsed;
    const linkRss = `${host}${path}`;
    this.log('linkRss:', linkRss);
    const currentLink = proxy ? url.resolve(proxy, linkRss) : link;
    return currentLink;
  }

  getCurrentLink(link) {
    const urlParsed = url.parse(link);
    const { host } = urlParsed;
    this.log('host:', host);
    const currentLink = host || link;
    return currentLink;
  }
}

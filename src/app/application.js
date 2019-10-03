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
    this.state = {
      appStatus: 'loading',
      links: [],
      listFeedsData: [],
      posts: [],
      correctInput: true,
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
    this.addWatchers();

    this.bindActions();

    this.onLoadSuccess();
  }

  addWatchers() {
    WatchJS.watch(this.state, 'posts', () => {
      const feedsList = this.getFeedList();
      const htmlFeedListHtml = this.getFeedListHtml(feedsList);
      $('#list-rss').html(htmlFeedListHtml);
    });

    WatchJS.watch(this.state.modalState, 'open', () => {
      const { open, postLink } = this.state.modalState;
      this.log('Open modal, postLink:', postLink);
      if (open) {
        const post = this.getPostByLink(postLink);
        this.renderModal(post);
      } else {
        this.hideModal();
      }
    });

    WatchJS.watch(this.state, 'appStatus', () => {
      switch (this.state.appStatus) {
        case 'loading':
          $('.spinner').show();
          break;
        case 'loaded':
          $('#input-rss').val('');
          $('.spinner').hide();
          break;
        default: break;
      }
    });

    WatchJS.watch(this.state, 'correctInput', () => {
      const input = $('#input-rss');
      if (this.state.correctInput) {
        input.removeClass('alert-danger');
        input.addClass('alert-dark');
      } else {
        input.addClass('alert-danger');
        input.removeClass('alert-dark');
      }
    });
  }

  bindActions() {
    $(document).on('change', '#input-rss', (event) => this.onInput(event));

    $(document).on('mouseup', '#add-rss', () => this.onAddRss());

    $(document).on('mouseup', '.open-post', (event) => this.onOpenPost(event));

    $('#modal-post').on('hidden.bs.modal', () => {
      this.state.modalState.open = false;
    });
  }

  destroy() { // eslint-disable-line class-methods-use-this
    $(document).off('change', '#input-rss');

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
    this.onLoadStart();
    this.addLinkRss(link)
      .then(() => {
        this.onLoadSuccess();
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
      this.state.correctInput = true;
    } else {
      this.state.correctInput = false;
    }
  }

  getFeedList() { // eslint-disable-line class-methods-use-this
    return JSON.parse(JSON.stringify(this.state.listFeedsData));
  }

  hasAlreadyLink(link) {
    return _.some(this.state.links, { link });
  }

  removeLink(link) {
    this.state.links = this.state.links.filter((item) => item === link);
  }

  getPostByLink(link) {
    const list = this.getPostsList();
    this.log('getPostByLink, list:', list);
    return _.find(list, { link });
  }

  getFeedListHtml(list) {
    return list.reduce((html, feed) => {
      const feedHtml = this.getFeedHtml(feed);
      return `${html}${feedHtml}`;
    }, '');
  }

  getFeedHtml(feed) { // eslint-disable-line class-methods-use-this
    const { title, description, link } = feed;
    const posts = this.getPostsList(link);
    return `<div class="feed">
      <h5>${title}</h5>
      <p>${description}</p>
      <div class="content">${posts.map((item) => this.getPostHtml(item)).join('')}</div>
      <hr>
    </div>`;
  }

  getPostHtml(post) { // eslint-disable-line class-methods-use-this
    this.log('postData:', post);
    return `<div class="item mb-1 mt-1 d-flex align-items-center">
      <button tabindex="0"  type="button" class="open-post btn-sm btn btn-info p-0 mr-2" data-toggle="modal" data-target="#infoModal" data-link="${post.link}">
        Open
      </button>
      <a href="${post.link}" target="_blank">${post.title}</a>
    </div>`;
  }

  getPostData(feedUrl, data) { // eslint-disable-line class-methods-use-this
    const link = $(data).find('link');
    const title = $(data).find('title');
    const description = $(data).find('description');
    if (link.length === 0 || link.length === 0) {
      throw new Exception('Ошибка');
    }
    return {
      feedUrl,
      link: link.text(),
      title: title.text(),
      description: description.text(),
    };
  }

  setPosts(posts) {
    this.state.posts = [...this.state.posts, ...posts];
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
    this.state.links = [...this.state.links, newFeedData];
    const currentLink = this.getLink(link, proxy);
    return this.network.get(currentLink)
      .then((response) => {
        this.log('dataRSS:', response);
        const { data } = response;
        const parsedData = this.rssParser(data);
        this.log('parsedDataPosts:', parsedData);
        this.updateRss(link, parsedData);
        const dataPosts = $(parsedData).find('item').toArray();
        const posts = dataPosts.map((item) => this.getPostData(link, item));
        this.setPosts(posts);
      })
      .catch((error) => {
        $('.toast-body').text('Произошла ошибка');
        $('.toast').toast('show');
        this.removeLink(link);
        this.log(error);
        this.renderAlert('Error', link);
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
    this.state.listFeedsData = [
      ...this.state.listFeedsData.filter((item) => item.link !== link),
      newFeedData,
    ];
    return true;
  }

  setOpenLinkPost(link) {
    this.state.modalState.postLink = link;
  }

  getPostsList(feedUrl = '') {
    if (!feedUrl) {
      return this.state.posts;
    }
    return this.state.posts.filter((post) => post.feedUrl === feedUrl);
  }

  openModal() {
    this.state.modalState.open = true;
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

  onLoadStart() {
    this.state.appStatus = 'loading';
  }

  onLoadSuccess() {
    this.state.appStatus = 'loaded';
  }

  renderModal(post) {
    this.log('Open modal, post:', post);
    $('#modal-post-label').text(post.link);
    $('.modal-body').text(post.description);
    $('#modal-post').modal({ show: true });
  }

  hideModal() { // eslint-disable-line class-methods-use-this
    $('#modal-post').modal({ show: false });
  }

  renderAlert(title, link) { // eslint-disable-line class-methods-use-this
    const alert = document.createElement('div');
    $('#application').prepend(alert);
    alert.outerHTML = `
    <div class="toast mt-0 w-100 alert alert-danger alert-dismissible fade show" role="alert" style="position: absolute;">
      <h4 class="alert-title">${title}</h4>
      <div class="alert-body">Couldn't get a RSS feed: <a target="_blank" class="alert-url" href="${link}">${link}</a></div>
      <button type="button" class="close" data-dismiss="alert" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>`;
  }
}

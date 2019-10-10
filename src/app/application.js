import getLogger from 'webpack-log';
import $ from 'jquery';
import _ from 'lodash';
import { getRSSData } from './utils';
import addWatchers from './view';

const logger = getLogger({ name: 'application', level: 'debug' });

export default class Application {
  constructor(network) {
    this.network = network;
    this.validators = [];
    this.state = {
      appStatus: 'loading',
      listFeedsData: [],
      correctInput: true,
      alert: {},
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
    this.addValidator((link) => !this.hasAlreadyLink(link));

    this.addWatchers();

    this.bindActions();

    this.onLoadSuccess();
  }

  addWatchers() {
    this.log('addWatchers');
    addWatchers(this.state);
  }

  bindActions() {
    $('#input-rss').on('change', (event) => this.onInput(event));

    $('#add-rss').on('mouseup', () => {
      if (!this.state.correctInput) {
        return;
      }
      this.onAddRSS();
    });

    $(document).on('mouseup', '.open-post', (event) => this.onOpenPost(event));

    $('#modal-post').on('hidden.bs.modal', () => {
      this.state.modalState.open = false;
    });

    $('.example-link').on('click', (event) => {
      event.stopPropagation();
      event.preventDefault();
      const link = event.currentTarget.href;
      this.log('Example link:', link);
      const input = $('#input-rss');
      input.val(link);
      input.trigger('change');
    });
  }

  destroy() { // eslint-disable-line class-methods-use-this
    $(document).off('mouseup', '.open-post');
  }

  onOpenPost(event) {
    this.log('Open post!');
    const element = $(event.currentTarget);
    const link = element.data('link');
    this.setOpenLinkPost(link);
    this.openModal();
  }

  onAddRSS() {
    const link = this.currentRSSUrl;
    this.onLoadStart();
    this.fetchRSS(link)
      .then(() => {
        this.onLoadSuccess();
      });
  }

  onInput(event) {
    const link = event.currentTarget.value;
    this.log('link:', link);
    const isCurrentLink = this.validateLink(link);
    if (isCurrentLink) {
      this.setNewLink(link);
      this.state.correctInput = true;
    } else {
      this.state.correctInput = false;
    }
  }

  hasAlreadyLink(link) {
    return _.some(this.state.listFeedsData, { link });
  }

  removeLink(link) {
    this.state.listFeedsData = this.state.listFeedsData.filter((item) => item === link);
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
    this.currentRSSUrl = link;
  }

  fetchRSS(link, proxy = '') {
    return this.network.get(link)
      .then((response) => {
        this.log('dataRSS:', response);
        const { data } = response;
        const feedData = getRSSData(link, data);
        this.addRSS(feedData);
        setTimeout(() => {
          this.fetchRSS(link, proxy);
        }, 5000);
      })
      .catch((error) => {
        this.logError(error);
        this.renderAlert('Error', link);
      });
  }

  addRSS(feedData) {
    const { link } = feedData;
    const alreadyData = _.find(this.state.listFeedsData, (item) => item.link === link);
    if (!alreadyData) {
      this.state.listFeedsData = [
        ...this.state.listFeedsData,
        feedData,
      ];
      return true;
    }

    const newPosts = _.differenceBy(feedData.posts, alreadyData.posts, 'link');
    if (!newPosts || newPosts.length === 0) {
      return false;
    }
    alreadyData.posts = [...alreadyData.posts, ...newPosts];
    const filteredFeeds = _.filter(this.state.listFeedsData, (item) => item.link !== link);
    this.state.listFeedsData = [
      ...filteredFeeds,
      alreadyData,
    ];
    return true;
  }

  setOpenLinkPost(link) {
    this.state.modalState.postLink = link;
  }

  openModal() {
    this.state.modalState.open = true;
  }

  onLoadStart() {
    this.state.appStatus = 'loading';
  }

  onLoadSuccess() {
    this.state.appStatus = 'loaded';
  }

  renderAlert(name, link) {
    this.state.alert = { name, link };
  }
}

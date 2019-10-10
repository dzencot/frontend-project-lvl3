import getLogger from 'webpack-log';
import $ from 'jquery';
import _ from 'lodash';
import validator from 'validator';
import { getRSSData } from './utils';
import addWatchers from './view';

const logger = getLogger({ name: 'application', level: 'debug' });
const log = (...params) => logger.debug(...params);
const logError = (...params) => logger.error(...params);

export default (network, useProxy = false) => {
  const validators = [];

  const state = {
    currentRSSUrl: '',
    appStatus: 'loading',
    listFeedsData: [],
    correctInput: true,
    alert: {},
    modalState: {
      open: false,
      postLink: '',
    },
  };

  validators.push((link) => !_.some(state.listFeedsData, { link }));
  validators.push((link) => validator.isURL(link, { require_tld: useProxy }));

  const validateLink = (link) => {
    const result = validators.reduce((carry, currentValidator) => {
      const currentResult = currentValidator(link);
      if (currentResult === false) {
        return false;
      }
      return carry;
    }, true);
    log('Validator result:', result);
    return result;
  };

  const addRSS = (feedData) => {
    const { link } = feedData;
    const alreadyData = _.find(state.listFeedsData, (item) => item.link === link);
    if (!alreadyData) {
      state.listFeedsData = [
        ...state.listFeedsData,
        feedData,
      ];
      return true;
    }

    const newPosts = _.differenceBy(feedData.posts, alreadyData.posts, 'link');
    if (!newPosts || newPosts.length === 0) {
      return false;
    }
    alreadyData.posts = [...alreadyData.posts, ...newPosts];
    const filteredFeeds = _.filter(state.listFeedsData, (item) => item.link !== link);
    state.listFeedsData = [
      ...filteredFeeds,
      alreadyData,
    ];
    return true;
  };

  const fetchRSS = (link) => network(link)
    .then((response) => {
      log('dataRSS:', response);
      const { data } = response;
      const feedData = getRSSData(link, data);
      addRSS(feedData);
      setTimeout(() => {
        fetchRSS(link);
      }, 5000);
    })
    .catch((error) => {
      logError(error);
      state.alert = { name: 'Error', link };
    });

  const bindActions = () => {
    $('#input-rss').on('change', (event) => {
      const link = event.currentTarget.value;
      log('link:', link);
      const isCurrentLink = validateLink(link);
      if (isCurrentLink) {
        state.currentRSSUrl = link;
        state.correctInput = true;
      } else {
        state.correctInput = false;
      }
    });

    $('#add-rss').on('mouseup', () => {
      if (!state.correctInput) {
        return;
      }
      const link = state.currentRSSUrl;
      state.appStatus = 'loading';
      fetchRSS(link)
        .then(() => {
          state.appStatus = 'loaded';
        });
    });

    $(document).on('mouseup', '.open-post', (event) => {
      log('Open post!');
      const element = $(event.currentTarget);
      const link = element.data('link');
      state.modalState.postLink = link;
      state.modalState.open = true;
    });

    $('#modal-post').on('hidden.bs.modal', () => {
      state.modalState.open = false;
    });

    $('.example-link').on('click', (event) => {
      event.stopPropagation();
      event.preventDefault();
      const link = event.currentTarget.href;
      log('Example link:', link);
      const input = $('#input-rss');
      input.val(link);
      input.trigger('change');
    });
  };

  addWatchers(state);

  bindActions();

  state.appStatus = 'loaded';
};

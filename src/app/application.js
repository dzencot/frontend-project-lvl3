import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import getLogger from 'webpack-log';
import WatchJS from 'melanke-watchjs';
import $ from 'jquery';
import _ from 'lodash';
import validator from 'validator';
import { getRSSData, getFeedUrl, getPostByLink } from './utils';
import { renderAlert, getFeedListHtml, fillModal } from './view';
import axios from './lib/axios';

const logger = getLogger({ name: 'application', level: 'debug' });
const log = (...params) => logger.debug(...params);
const logError = (...params) => logger.error(...params);

export default () => {
  const state = {
    currentRSSUrl: '',
    getFeedStatus: '',
    listFeedsData: [],
    correctInput: true,
    alert: {},
    openedModalLink: '',
  };
  const applicationContainer = document.getElementById('application');
  const modal = applicationContainer.querySelector('#modal-post');
  const input = applicationContainer.querySelector('#input-rss');
  const form = applicationContainer.querySelector('#form');
  const exampleLinks = applicationContainer.querySelectorAll('a.example-link');
  const listRss = applicationContainer.querySelector('#list-rss');
  const spinner = applicationContainer.querySelector('.spinner');

  const validateLink = (link) => {
    const isNewLink = !_.some(state.listFeedsData, { link });
    const isLink = validator.isURL(link, {
      require_tld: _.isNull(process.env.CORS_PROXY_URL),
    });
    log('Validator result:', isNewLink && isLink);
    return isNewLink && isLink;
  };

  const addRSS = (newFeedData) => {
    const { link } = newFeedData;
    const feed = _.find(state.listFeedsData, (item) => item.link === link);
    if (!feed) {
      state.listFeedsData.push(newFeedData);
      return true;
    }

    const newPosts = _.differenceBy(newFeedData.posts, feed.posts, 'link');
    if (!newPosts || newPosts.length === 0) {
      return false;
    }
    feed.posts.push(...newPosts);
    return true;
  };

  const fetchRSS = (link) => {
    const feedUrl = getFeedUrl(link);
    return axios.get(feedUrl)
      .then((response) => {
        const { data } = response;
        const feedData = getRSSData(link, data);
        addRSS(feedData);
        setTimeout(() => {
          fetchRSS(link);
        }, 5000);
        state.getFeedStatus = 'loaded';
      })
      .catch((error) => {
        logError(error);
        state.alert = { name: 'Error', link };
        state.getFeedStatus = 'alert';
      });
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const link = formData.get('url');
    const isCurrentLink = validateLink(link);
    if (!isCurrentLink) {
      state.getFeedStatus = 'invalid';
      return;
    }
    state.getFeedStatus = 'loading';
    fetchRSS(link);
  });

  // TODO: без жквери обработчик не работает. Найти другой способ?
  $(modal).on('show.bs.modal', (event) => {
    log('Open post!');
    const { link } = event.relatedTarget.dataset;
    state.openedModalLink = link;
  });

  exampleLinks.forEach((exampleLink) => {
    exampleLink.addEventListener('click', (event) => {
      event.stopPropagation();
      event.preventDefault();
      const link = event.currentTarget.href;
      log('Example link:', link);
      state.getFeedStatus = 'loading';
      fetchRSS(link);
    });
  });

  WatchJS.watch(state, 'listFeedsData', () => {
    const feedsList = _.cloneDeep(state.listFeedsData);
    const htmlFeedListHtml = getFeedListHtml(feedsList);
    listRss.innerHTML = htmlFeedListHtml;
  });

  WatchJS.watch(state, 'openedModalLink', () => {
    const { openedModalLink } = state;
    const post = getPostByLink(state, openedModalLink);
    fillModal(modal, post);
  });

  WatchJS.watch(state, 'currentRSSUrl', () => {
    const { currentRSSUrl } = state;
    input.value = currentRSSUrl;
  });

  WatchJS.watch(state, 'getFeedStatus', () => {
    switch (state.getFeedStatus) {
      case 'loading':
        spinner.style.display = 'block';
        input.classList.remove('alert-danger');
        input.classList.add('alert-dark');
        break;
      case 'loaded':
        input.value = '';
        spinner.style.display = 'none';
        break;
      case 'valid':
        input.classList.remove('alert-danger');
        input.classList.add('alert-dark');
        break;
      case 'invalid':
        input.classList.add('alert-danger');
        input.classList.remove('alert-dark');
        break;
      case 'alert':
        spinner.style.display = 'none';
        renderAlert(applicationContainer, state.alert);
        break;
      default: break;
    }
  });
};

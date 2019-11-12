import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import getLogger from 'webpack-log';
import WatchJS from 'melanke-watchjs';
import $ from 'jquery';
import _ from 'lodash';
import validator from 'validator';
import axios from 'axios';
import httpadapter from 'axios/lib/adapters/http';
import parseFeed from './rssParser';
import {
  viewInit, fillModal, renderAlert, changeLanguage, getFeedListHtml,
} from './view';

axios.defaults.adapter = httpadapter;

const logger = getLogger({ name: 'application', level: 'debug' });
const log = (...params) => logger.debug(...params);
const logError = (...params) => logger.error(...params);

const getFeedUrl = (link) => {
  const proxyUrl = 'https://cors-anywhere.herokuapp.com';
  return `${proxyUrl}/${link}`;
};

const isValidLink = (link, feeds) => {
  const isNewLink = !_.some(feeds, { link });
  const isLink = validator.isURL(link, {
    require_tld: false,
  });
  log('Validator result:', isNewLink && isLink);
  return isNewLink && isLink;
};

const app = () => {
  const state = {
    currentRSSUrl: '',
    fetchFeedStatus: '',
    inputUrlStatus: '',
    feeds: [],
    posts: [],
    openedModalLink: '',
    errorCode: null,
  };

  const applicationContainer = document.getElementById('application');
  const modal = applicationContainer.querySelector('#modal-post');
  const input = applicationContainer.querySelector('#input-rss');
  const form = applicationContainer.querySelector('#form');
  const exampleLinks = applicationContainer.querySelectorAll('a.example-link');
  const listRss = applicationContainer.querySelector('#list-rss');
  const spinner = applicationContainer.querySelector('.spinner');
  const changeLanguageButtons = document.querySelectorAll('.change-language');

  const addOrUpdateFeed = (feed) => {
    const addedFeed = state.feeds.find((item) => item.id === feed.id);
    if (addedFeed) {
      log(`update feed ${feed.id}`);
      addedFeed.title = feed.title;
      addedFeed.description = feed.description;
    } else {
      log(`add feed ${feed.id}`);
      state.feeds.push(feed);
    }
  };

  const addPosts = (link, posts) => {
    const addedPosts = state.posts.find((item) => item.idFeed === link);
    const newPosts = _.differenceBy(posts, addedPosts, 'link');
    if (!newPosts || newPosts.length === 0) {
      return false;
    }
    state.posts.push(...newPosts);
    return true;
  };

  const getFeed = (id) => {
    const feed = state.feeds.find((item) => item.id === id);
    return feed;
  };

  const fetchRSS = (link) => {
    const url = new URL(link);

    const currentFeed = getFeed(url.origin);
    if (currentFeed) {
      currentFeed.status = 'loading'; // eslint-disable-line
    }
    const feedUrl = getFeedUrl(link);
    return axios.get(feedUrl)
      .then((response) => {
        const { data } = response;
        const feed = parseFeed(data);
        feed.id = url.origin;
        feed.status = 'loaded';
        const posts = feed.items.map((item) => ({ idFeed: url.origin, status: 'new', ...item }));

        return { feed, posts };
      });
  };

  const updateRSS = (link) => {
    const url = new URL(link);
    const currentFeed = getFeed(url.origin);

    fetchRSS(link)
      .then(({ feed, posts }) => {
        addOrUpdateFeed(feed);
        addPosts(url.origin, posts);

        currentFeed.status = 'loaded'; // eslint-disable-line
        setTimeout(() => {
          updateRSS(link);
        }, 5000);
      })
      .catch((err) => {
        logError(err);
        currentFeed.status = 'failed'; // eslint-disable-line
        setTimeout(() => {
          updateRSS(link);
        }, 5000);
      });
  };

  const startLoading = (link) => {
    const url = new URL(link);
    state.currentRSSUrl = link;
    state.fetchFeedStatus = 'loading';
    fetchRSS(link)
      .then(({ feed, posts }) => {
        addOrUpdateFeed(feed);
        addPosts(url.origin, posts);
        state.fetchFeedStatus = 'loaded';
        setTimeout(() => {
          updateRSS(link);
        }, 5000);
      })
      .catch((err) => {
        logError(err);
        state.errorCode = _.get(err, 'response.status');
        state.fetchFeedStatus = 'failed';
      });
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const link = formData.get('url');
    const isCurrentLink = isValidLink(link, state);
    if (!isCurrentLink) {
      state.inputUrlStatus = 'invalid';
      return;
    }
    state.inputUrlStatus = 'valid';
    startLoading(link);
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
      startLoading(link);
    });
  });

  changeLanguageButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
      const { language } = event.currentTarget.dataset;
      log('language:', language);
      // TODO: сделать изменение языка всей страницы. сейчас переводятся только сообщения об ошибках
      changeLanguage(language);
    });
  });

  WatchJS.watch(state, 'feeds', () => {
    const htmlFeedListHtml = getFeedListHtml(state.feeds, state.posts);
    listRss.innerHTML = htmlFeedListHtml;
  });

  WatchJS.watch(state, 'openedModalLink', () => {
    const { openedModalLink } = state;
    const post = state.posts.find((item) => item.link === openedModalLink);
    fillModal(modal, post);
  });

  WatchJS.watch(state, 'fetchFeedStatus', () => {
    switch (state.fetchFeedStatus) {
      case 'loading':
        log('START LOADING', state.currentRSSUrl);
        const alert = document.querySelector('[role="alert"]'); // eslint-disable-line
        if (alert) {
          alert.remove();
        }
        spinner.style.display = 'block';
        input.classList.remove('alert-danger');
        input.classList.add('alert-dark');
        break;
      case 'loaded':
        input.value = '';
        spinner.style.display = 'none';
        break;
      case 'failed':
        spinner.style.display = 'none';
        renderAlert(applicationContainer, state.currentRSSUrl, state.errorCode);
        break;
      default:
        const errorMessage = `Undefined status: ${state.status}`; // eslint-disable-line
        logError(errorMessage);
        throw new Error(errorMessage);
    }
  });

  WatchJS.watch(state, 'inputUrlStatus', () => {
    switch (state.inputUrlStatus) {
      case 'valid':
        input.classList.remove('alert-danger');
        input.classList.add('alert-dark');
        break;
      case 'invalid':
        input.classList.add('alert-danger');
        input.classList.remove('alert-dark');
        break;
      default:
        const errorMessage = `Undefined status: ${state.inputUrlStatus}`; // eslint-disable-line
        logError(errorMessage);
        throw new Error(errorMessage);
    }
  });
};

export default () => viewInit().then(app);

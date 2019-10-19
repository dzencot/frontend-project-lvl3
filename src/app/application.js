import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import getLogger from 'webpack-log';
import WatchJS from 'melanke-watchjs';
import $ from 'jquery';
import _ from 'lodash';
import validator from 'validator';
import axios from './lib/axios';
import i18next from './lib/i18next';

const logger = getLogger({ name: 'application', level: 'debug' });
const log = (...params) => logger.debug(...params);
const logError = (...params) => logger.error(...params);

const getPostHtml = (post) => {
  const html = `<div class="item mb-1 mt-1 d-flex align-items-center">
    <button tabindex="0"  type="button" class="open-post btn-sm btn btn-info p-1 mr-2" data-toggle="modal" data-target="#modal-post" data-link="${post.link}">
      Open
    </button>
    <a href="${post.link}" target="_blank">${post.title}</a>
  </div>`;
  return html;
};

const getFeedHtml = (feed) => {
  const { title, description, posts } = feed;
  const sortedPosts = posts.sort((post1, post2) => post1.name > post2.name);
  const postsHtml = sortedPosts.map((item) => getPostHtml(item)).join('');
  return `<div class="feed">
    <h5>${title}</h5>
    <p>${description}</p>
    <div class="content">${postsHtml}</div>
    <hr>
  </div>`;
};

const getFeedListHtml = (list) => list.reduce((html, feed) => {
  const feedHtml = getFeedHtml(feed);
  return `${html}${feedHtml}`;
}, '');

const fillModal = (modal, post) => {
  const titleEl = modal.querySelector('#post-title');
  titleEl.innerHTML = post.title;
  const descriptionEl = modal.querySelector('#post-description');
  descriptionEl.innerHTML = post.description;
  const linkEl = modal.querySelector('#post-link');
  linkEl.setAttribute('href', post.link);
};

const renderAlert = (container, alertData) => {
  const { link, status, statusText } = alertData;
  const alert = document.createElement('div');
  container.prepend(alert);
  alert.outerHTML = `
  <div class="toast mt-0 w-100 alert alert-danger alert-dismissible fade show" role="alert" style="position: absolute;">
    <h4 class="alert-title">${status}</h4>
    <div class="alert-body">${statusText} <a target="_blank" class="alert-url" href="${link}">${link}</a></div>
    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
      <span aria-hidden="true">&times;</span>
    </button>
  </div>`;
};

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
  if (link.length === 0 && title.length === 0) {
    const errorMessage = 'Not found post data';
    throw new Error(errorMessage);
  }
  return {
    feedUrl,
    link: link.textContent || link.getAttribute('href'),
    title: title.textContent,
    description: description ? description.textContent : '',
  };
};

const getRSSData = (link, data) => {
  const domParser = new DOMParser();
  const parsedData = domParser.parseFromString(data, 'text/xml');
  const title = parsedData.querySelector('rss > channel > title, feed > title');
  const description = parsedData.querySelector('rss > channel > description, feed > title');
  if (title.length === 0 && description.length === 0) {
    const errorMessage = 'Not found feed data';
    logError(errorMessage);
    throw new Error(errorMessage);
  }
  const dataPosts = Array.from(parsedData.querySelectorAll('item, entry'));
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

const validateLink = (link, state) => {
  const isNewLink = !_.some(state.listFeedsData, { link });
  const isLink = validator.isURL(link, {
    require_tld: _.isNull(process.env.CORS_PROXY_URL),
  });
  log('Validator result:', isNewLink && isLink);
  return isNewLink && isLink;
};

const app = (i18n) => {
  const state = {
    currentRSSUrl: '',
    getFeedStatus: '',
    listFeedsData: [],
    correctInput: true,
    alert: {},
    openedModalLink: '',
    language: '',
  };
  const applicationContainer = document.getElementById('application');
  const modal = applicationContainer.querySelector('#modal-post');
  const input = applicationContainer.querySelector('#input-rss');
  const form = applicationContainer.querySelector('#form');
  const exampleLinks = applicationContainer.querySelectorAll('a.example-link');
  const listRss = applicationContainer.querySelector('#list-rss');
  const spinner = applicationContainer.querySelector('.spinner');
  const changeLanguageButtons = document.querySelectorAll('.change-language');

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
      .catch((err) => {
        logError(err);
        const { response } = err;
        if (response) {
          const { status, statusText } = err.response;
          state.alert = { status: i18n.t(status), statusText: i18n.t(statusText), link };
        } else {
          const { message } = err;
          state.alert = { status: i18n.t('Error'), statusText: i18n.t(message), link };
        }
        state.getFeedStatus = 'alert';
      });
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const link = formData.get('url');
    const isCurrentLink = validateLink(link, state);
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

  changeLanguageButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
      const { language } = event.currentTarget.dataset;
      log('language:', language);
      // TODO: сделать изменение языка всей страницы. сейчас переводятся только сообщения об ошибках
      state.language = language;
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

  WatchJS.watch(state, 'language', () => {
    const { language } = state;
    i18n.changeLanguage(language);
  });

  WatchJS.watch(state, 'getFeedStatus', () => {
    switch (state.getFeedStatus) {
      case 'loading':
        spinner.style.display = 'block';
        input.classList.remove('alert-danger');
        input.classList.add('alert-dark');
        const alert = document.querySelector('[role="alert"]'); // eslint-disable-line
        if (alert) {
          alert.remove();
        }
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

export default () => i18next().then((i18n) => app(i18n));

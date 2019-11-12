import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import getLogger from 'webpack-log';
import i18next from 'i18next';
import detector from 'i18next-browser-languagedetector';

import translationRu from '../../assets/i18n/ru/translation.json';
import translationEn from '../../assets/i18n/en/translation.json';

const logger = getLogger({ name: 'view', level: 'debug' });
const log = (...params) => logger.debug(...params);

const getPostHtml = (post) => {
  const html = `<div class="item mb-1 mt-1 d-flex align-items-center">
    <button tabindex="0"  type="button" class="open-post btn-sm btn btn-info p-1 mr-2" data-toggle="modal" data-target="#modal-post" data-link="${post.link}">
      Open
    </button>
    <a href="${post.link}" target="_blank">${post.title}</a>
  </div>`;
  return html;
};

const getStatusHtml = (status) => {
  switch (status) {
    case 'loading':
      return `<div class="spinner-border" style="width: 24px; height: 24px;" role="status">
        <span class="sr-only">Loading...</span>
      </div>`;
    case 'failed':
      return ' <div class="alert-danger d-inline">Failed</div>';
    default:
      return '';
  }
};

const getFeedHtml = (feed, posts) => {
  const { title, description } = feed;
  const sortedPosts = posts.sort((post1, post2) => post1.name > post2.name);
  const postsHtml = sortedPosts.map((item) => getPostHtml(item)).join('');
  const statusHtml = getStatusHtml(feed.status);
  return `<div class="feed">
    <h5>${title}${statusHtml}</h5>
    <p>${description}</p>
    <div class="content">${postsHtml}</div>
    <hr>
  </div>`;
};

const getFeedListHtml = (feeds, posts) => feeds.map((feed) => {
  const feedPosts = posts.filter((item) => item.idFeed === feed.id);
  return getFeedHtml(feed, feedPosts);
}).join('');

const fillModal = (modal, post) => {
  const titleEl = modal.querySelector('#post-title');
  titleEl.innerHTML = post.title;
  const descriptionEl = modal.querySelector('#post-description');
  descriptionEl.innerHTML = post.description;
  const linkEl = modal.querySelector('#post-link');
  linkEl.setAttribute('href', post.link);
};

const renderAlert = (container, link, status = 'Unknown Error') => {
  const alert = document.createElement('div');
  container.prepend(alert);
  log('render error status:', status);
  const statusText = i18next.t(status);
  alert.outerHTML = `
  <div class="toast mt-0 w-100 alert alert-danger alert-dismissible fade show" role="alert" style="position: absolute;">
    <h4 class="alert-title">${status}</h4>
    <div class="alert-body">${statusText} <a target="_blank" class="alert-url" href="${link}">${link}</a></div>
    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
      <span aria-hidden="true">&times;</span>
    </button>
  </div>`;
};

const viewInit = () => i18next
  .use(detector)
  .init({
    fallbackLng: 'en',
    resources: {
      en: {
        translation: translationEn,
      },
      ru: {
        translation: translationRu,
      },
    },
  });

const changeLanguage = (lang) => {
  i18next.changeLanguage(lang);
};

export {
  viewInit,
  getPostHtml,
  getFeedHtml,
  getFeedListHtml,
  fillModal,
  renderAlert,
  changeLanguage,
};

import _ from 'lodash';
import $ from 'jquery';
import WatchJS from 'melanke-watchjs';
import getLogger from 'webpack-log';
import { getPostByLink } from './utils';

const log = getLogger({ name: 'run', level: 'debug' }).debug;

const getPostHtml = (post) => {
  log('postData:', post);
  return `<div class="item mb-1 mt-1 d-flex align-items-center">
    <button tabindex="0"  type="button" class="open-post btn-sm btn btn-info p-0 mr-2" data-toggle="modal" data-target="#infoModal" data-link="${post.link}">
      Open
    </button>
    <a href="${post.link}" target="_blank">${post.title}</a>
  </div>`;
};

const getFeedHtml = (feed) => {
  const { title, description, posts } = feed;
  const sortedPosts = posts.sort((post1, post2) => post1.name > post2.name);
  const postsHtml = sortedPosts.reduce((html, item) => `${html}${getPostHtml(item)}`, '');
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

const renderModal = (post) => {
  log('Open modal, post:', post);
  $('#modal-post-label').text(post.link);
  $('.modal-body').text(post.description);
  $('#modal-post').modal({ show: true });
};

const hideModal = () => {
  $('#modal-post').modal({ show: false });
};

const renderAlert = (name, link) => {
  const alert = document.createElement('div');
  $('#application').prepend(alert);
  alert.outerHTML = `
  <div class="toast mt-0 w-100 alert alert-danger alert-dismissible fade show" role="alert" style="position: absolute;">
    <h4 class="alert-title">${name}</h4>
    <div class="alert-body">Couldn't get a RSS feed: <a target="_blank" class="alert-url" href="${link}">${link}</a></div>
    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
      <span aria-hidden="true">&times;</span>
    </button>
  </div>`;
};

const addWatchers = (state) => {
  WatchJS.watch(state, 'listFeedsData', () => {
    const feedsList = _.cloneDeep(state.listFeedsData);
    const htmlFeedListHtml = getFeedListHtml(feedsList);
    $('#list-rss').html(htmlFeedListHtml);
  });

  WatchJS.watch(state.modalState, 'open', () => {
    const { open, postLink } = state.modalState;
    log('Open modal, postLink:', postLink);
    if (open) {
      const post = getPostByLink(state, postLink);
      renderModal(post);
    } else {
      hideModal();
    }
  });

  WatchJS.watch(state, 'appStatus', () => {
    switch (state.appStatus) {
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

  WatchJS.watch(state, 'correctInput', () => {
    const input = $('#input-rss');
    if (state.correctInput) {
      input.removeClass('alert-danger');
      input.addClass('alert-dark');
    } else {
      input.addClass('alert-danger');
      input.removeClass('alert-dark');
    }
  });

  WatchJS.watch(state, 'alert', () => {
    const { name, link } = state.alert;
    renderAlert(name, link);
  });
};


export default addWatchers;

import $ from 'jquery';
import WatchJS from 'melanke-watchjs';
import getLogger from 'webpack-log';

const log = getLogger({ name: 'run', level: 'debug' }).debug;

const getFeedHtml = (feed) => {
  const { title, description, link } = feed;
  const posts = this.getPostsList(link);
  return `<div class="feed">
    <h5>${title}</h5>
    <p>${description}</p>
    <div class="content">${posts.map((item) => this.getPostHtml(item)).join('')}</div>
    <hr>
  </div>`;
};

const getFeedListHtml = (list) => {
  return list.reduce((html, feed) => {
    const feedHtml = getFeedHtml(feed);
    return `${html}${feedHtml}`;
  }, '');
};

const addWatchers = (state) => {
  WatchJS.watch(state, 'posts', () => {
    const feedsList = JSON.parse(JSON.stringify(state.listFeedsData));
    const htmlFeedListHtml = getFeedListHtml(feedsList);
    $('#list-rss').html(htmlFeedListHtml);
  });

  WatchJS.watch(state.modalState, 'open', () => {
    const { open, postLink } = state.modalState;
    log('Open modal, postLink:', postLink);
    if (open) {
      const post = getPostByLink(postLink);
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
};

export { addWatchers };

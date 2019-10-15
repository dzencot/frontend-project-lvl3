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
  const { link, name } = alertData;
  const alert = document.createElement('div');
  container.prepend(alert);
  alert.outerHTML = `
  <div class="toast mt-0 w-100 alert alert-danger alert-dismissible fade show" role="alert" style="position: absolute;">
    <h4 class="alert-title">${name}</h4>
    <div class="alert-body">Couldn't get a RSS feed: <a target="_blank" class="alert-url" href="${link}">${link}</a></div>
    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
      <span aria-hidden="true">&times;</span>
    </button>
  </div>`;
};

export {
  renderAlert,
  fillModal,
  getFeedListHtml,
  getFeedHtml,
  getPostHtml,
};

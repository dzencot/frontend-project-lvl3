/* global document DOMParser */
import '../style.css';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import $ from 'jquery';
import url from 'url';
import getLogger from 'webpack-log';
import validator from 'validator';
import axios from './lib/axios';

import Application from './application';

const log = getLogger({ name: 'run', level: 'debug' }).debug;

const getCurrentLink = (link) => {
  const urlParsed = url.parse(link);
  const { host } = urlParsed;
  log('host:', host);
  const currentLink = host || link;
  return currentLink;
};

export default (useProxy = true) => {
  log('init');
  const corsProxyUrl = 'https://cors-anywhere.herokuapp.com';
  const input = $(document).find('input');
  const addRssButton = $(document).find('#add-rss');
  const application = new Application();
  application.init();
  application.addValidator((link) => {
    log('Check link:', link);
    return validator.isURL(link, { require_tld: false });
  });
  application.addValidator((link) => !application.isAlreadyHasLink(link));

  log('input:', input);
  input.on('change', (event) => {
    const link = event.currentTarget.value;
    log('link:', link);
    const currentLink = getCurrentLink(link);
    log('currentLInk:', currentLink);
    const isCurrentLink = application.validateLink(link);
    if (isCurrentLink) {
      application.setNewLink(link);
      input.removeClass('is-invalid');
    } else {
      input.addClass('is-invalid');
    }
  });

  addRssButton.on('mouseup', () => {
    const link = application.currentRssUrl;
    if (!application.validateLink(link)) {
      return false;
    }
    application.addLinkRss(link);
    const urlParsed = url.parse(link);
    const { host, path } = urlParsed;
    const linkRss = `${host}${path}`;
    log('linkRss:', linkRss);
    const currentLink = useProxy ? url.resolve(corsProxyUrl, linkRss) : link;
    log('CURRENT LINK:', currentLink);
    return axios.get(currentLink)
      .then((response) => {
        log('dataRSS:', response);
        const { data } = response;
        const parser = new DOMParser();
        const parsedData = parser.parseFromString(data, 'text/xml');
        log('parsedDataPosts:', parsedData);
        application.updateRss(link, parsedData);
        const dataPosts = $(parsedData).find('item').toArray();
        const posts = dataPosts.map((item) => application.getPostData(item));
        application.setPosts(posts);
      })
      .catch((error) => {
        $('.toast-body').text('Произошла ошибка');
        $('.toast').toast('show');
        application.removeLink(link);
        log(error);
      });
  });
};

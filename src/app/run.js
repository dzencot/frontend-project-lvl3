/* global document DOMParser */
import '../style.css';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import $ from 'jquery';
import getLogger from 'webpack-log';
import validator from 'validator';
import axios from './lib/axios';

import Application from './application';

const log = getLogger({ name: 'run', level: 'debug' }).debug;

export default (useProxy = true) => {
  log('init');
  const corsProxyUrl = 'https://cors-anywhere.herokuapp.com';
  const input = $(document).find('input');
  const addRssButton = $(document).find('#add-rss');
  const application = new Application();
  application.init();
  application.addValidator((link) => validator.isURL(link, { require_tld: false }));
  application.addValidator((link) => !application.isAlreadyHasLink(link));

  log('input:', input);
  input.on('change', (event) => {
    log('event:', event);
    const link = event.currentTarget.value;
    // const urlParsed = url.parse(link);
    // const originUrl = `${urlParsed.host}`;
    // log('originUrl:', originUrl);
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
    const proxyLink = useProxy ? `${corsProxyUrl}/${link}` : link;
    log('Proxylink:', proxyLink);
    return axios.get(proxyLink)
      .then((response) => {
        log('dataRSS:', response);
        const { data } = response;
        const parser = new DOMParser();
        const parsedData = parser.parseFromString(data, 'text/xml');
        log('parsedData:', parsedData);
        application.updateRss(link, parsedData);
        input.val('');
        $('.toast-body').text('Источник добавлен');
        $('.toast').toast('show');
      })
      .then(() => axios.get(`${proxyLink}/feed`))
      .then((response) => {
        log('dataRSS:', response);
        const { data } = response;
        const parser = new DOMParser();
        const parsedData = parser.parseFromString(data, 'text/xml');
        log('parsedDataPosts:', parsedData);
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

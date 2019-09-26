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
  const domParser = new DOMParser();
  const parser = (data) => domParser.parseFromString(data, 'text/xml');

  const application = new Application(axios, parser);
  application.init();
  application.addValidator((link) => {
    log('Check link:', link);
    const result = validator.isURL(link, { require_tld: useProxy });
    return result;
  });
  application.addValidator((link) => !application.hasAlreadyLink(link));

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
      return;
    }
    application.addLinkRss(link, useProxy ? corsProxyUrl : '')
      .then(() => {
        input.val('');
      });
  });
};

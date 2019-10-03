/* global DOMParser */
import '../style.css';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import getLogger from 'webpack-log';
import validator from 'validator';
import axios from './lib/axios';

import Application from './application';

const log = getLogger({ name: 'run', level: 'debug' }).debug;

export default (useProxy = true) => {
  log('init');
  const corsProxyUrl = 'https://cors-anywhere.herokuapp.com';
  const domParser = new DOMParser();
  const parser = (data) => domParser.parseFromString(data, 'text/xml');

  const network = {
    ...axios,
    get: (link, ...attributes) => {
      const currentLink = useProxy ? `${corsProxyUrl}/${link}` : link;
      return axios.get(currentLink, attributes);
    },
  };
  const application = new Application(network, parser);
  application.init();
  application.addValidator((link) => validator.isURL(link, { require_tld: useProxy }));
  application.addValidator((link) => !application.hasAlreadyLink(link));
};

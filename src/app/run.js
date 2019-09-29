/* global DOMParser */
import '../style.css';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
// import HttpsProxyAgent from 'https-proxy-agent'
// import $ from 'jquery';
// import url from 'url';
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
  // const httpsAgent = new HttpsProxyAgent(corsProxyUrl);
  // var res = await axios.get('https://api.ipify.org?format=json', {
  //     httpsAgent: agent,
  // });
  // const proxy = useProxy ? { httpsAgent } : {};
  // const network = axios.create({
  //   proxy,
  // });

  const network = {
    ...axios,
    get: (link, ...attributes) => {
      const currentLink = useProxy ? `${corsProxyUrl}/${link}` : link;
      return axios.get(currentLink, attributes);
    },
  };
  const application = new Application(network, parser);
  application.init();
  application.bindActions();
  application.addValidator((link) => validator.isURL(link, { require_tld: useProxy }));
  application.addValidator((link) => !application.hasAlreadyLink(link));
};

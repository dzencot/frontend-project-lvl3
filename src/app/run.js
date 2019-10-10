import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import getLogger from 'webpack-log';
import axios from './lib/axios';

import app from './application';

const log = getLogger({ name: 'run', level: 'debug' }).debug;

export default (useProxy = true) => {
  log('init');
  const corsProxyUrl = 'https://cors-anywhere.herokuapp.com';

  const getFeedDataPromise = (link) => {
    const currentLink = useProxy ? `${corsProxyUrl}/${link}` : link;
    return axios.get(currentLink);
  };

  app(getFeedDataPromise, useProxy);
};

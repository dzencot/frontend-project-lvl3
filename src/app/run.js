import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import getLogger from 'webpack-log';

import app from './application';

const log = getLogger({ name: 'run', level: 'debug' }).debug;

export default () => {
  log('init');
  app();
};

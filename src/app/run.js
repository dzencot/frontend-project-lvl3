/* global document */
// import _ from 'lodash';
import '../style.css';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import $ from 'jquery';
import getLogger from 'webpack-log';

import Application from './application';

const log = getLogger({ name: 'run', level: 'debug' });

export default () => {
  const element = $(document).find('input');
  const application = new Application(element);
  application.init();
  application.bindActions();
};

/* global document */
// import _ from 'lodash';
import '../style.css';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import $ from 'jquery';
import getLogger from 'webpack-log';

import Application from './application';

const log = getLogger({ name: 'run', level: 'debug' }).debug;

export default () => {
  log('init');
  const input = $(document).find('input');
  const addRssButton = $(document).find('#add-rss');
  const application = new Application();
  application.init();
  input.on('change', (event) => application.onChangeLink(event));
  log('button:', addRssButton);
  addRssButton.on('mouseup', (event) => application.onAddRss(event));
};

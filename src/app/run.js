/* global document */
// import _ from 'lodash';
import '../style.css';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import $ from 'jquery';
import getLogger from 'webpack-log';
import validator from 'validator';
import axios from 'axios';

import Application from './application';

const log = getLogger({ name: 'run', level: 'debug' }).debug;

export default () => {
  log('init');
  const input = $(document).find('input');
  const addRssButton = $(document).find('#add-rss');
  const application = new Application(axios);
  application.init();
  application.addValidator((data) => validator.isURL(data));
  input.on('change', (event) => {
    const link = event.currentTarget.value;
    const isCurrentLink = application.validateLink(link);
    if (isCurrentLink) {
      application.setNewLink(link);
      input.removeClass('is-invalid');
    } else {
      input.addClass('is-invalid');
    }
  });
  addRssButton.on('mouseup', (event) => application.onAddRss(event));
};

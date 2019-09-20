/* global DOMParser */
import getLogger from 'webpack-log';
import validator from 'validator';
import $ from 'jquery';
// import axios from './lib/axios';
import axios from 'axios';
// import url from 'url';
import WatchJS from 'melanke-watchjs';

const logger = getLogger({ name: 'application', level: 'debug' });

export default class Application {
  constructor(input, addRssButon) {
    this.input = input;
    this.addRssButon = addRssButon;
    this.currentRssUrl = '';
    this.corsProxyUrl = 'https://cors-anywhere.herokuapp.com';
    this.axiosConfig = {};
    this.data = {
      feedList: null,
    };
  }

  log(...params) { // eslint-disable-line class-methods-use-this
    logger.debug(...params);
  }

  logError(...params) { // eslint-disable-line class-methods-use-this
    logger.error(...params);
  }

  init() {
    WatchJS.watch(this.feedList, () => {
      this.log('TESWT!!!');
    });
  }

  onChangeLink(event) {
    this.log('onChange');
    const nextValue = event.currentTarget.value;
    const isCurrentValue = validator.isURL(nextValue);
    this.log('nextValue', nextValue);
    this.log('isCurrentValue', isCurrentValue);
    if (isCurrentValue) {
      this.currentRssUrl = nextValue;
      $(event.currentTarget).removeClass('is-invalid');
    } else {
      $(event.currentTarget).addClass('is-invalid');
    }
  }

  onAddRss() {
    const link = `${this.corsProxyUrl}/${this.currentRssUrl}`;
    this.data.feedList = link;
    // this.getDataRss(link)
    //   .then((dataRss) => {
    //     this.log('dataRSS:', dataRss);
    //   })
    //   .catch((error) => {
    //     this.logError(error);
    //   });
  }

  getDataRss(rssLink) {
    this.log('rssLInk: ', rssLink);
    return axios.get(rssLink, this.axiosConfig)
      .then((response) => {
        this.log('data:', response);
        const { data } = response;
        const parser = new DOMParser();
        const parsedData = parser.parseFromString(data, 'text/xml');
        this.log('parsedData:', parsedData);
        return parsedData;
      });
  }
}

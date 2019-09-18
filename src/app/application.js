import getLogger from 'webpack-log';
import validator from 'validator';

const logger = getLogger({ name: 'application', level: 'debug' }).debug;

export default class Application {
  constructor(element) {
    this.element = element;
    this.currentRssUrl = '';
  }

  log(...params) { // eslint-disable-line class-methods-use-this
    logger(...params);
  }

  init() {
    this.log('init');
  }

  bindActions() {
    this.log('bindActions');
    this.element.on('change', (event) => this.onChange(event));
  }

  onChange(event) {
    this.log('onChange');
    const nextValue = event.currentTarget.value;
    const isCurrentValue = validator.isURL(nextValue);
    this.log('nextValue', nextValue);
    this.log('isCurrentValue', isCurrentValue);
    if (isCurrentValue) {
      this.currentRssUrl = nextValue;
    } else {
      this.element.addClass('error');
    }
  }
}

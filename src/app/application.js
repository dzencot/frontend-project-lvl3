export default class Application {
  constructor(element) {
    this.element = element;
  }

  init() {
    this.element.textContent = 'hello, world!';
    console.log('hi'); // eslint-disable-line no-console
  }
}

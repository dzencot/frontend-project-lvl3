/* global document */
// import _ from 'lodash';
import '../style.css';
import 'bootstrap';
// import 'bootstrap/dist/css/bootstrap.min.css';
import Application from './application';

export default () => {
  const element = document.getElementById('application');
  const application = new Application(element);
  application.init();
};

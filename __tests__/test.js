// @ts-check
import fs from 'fs';
import path from 'path';
import { html } from 'js-beautify';
import nock from 'nock';
import $ from 'jquery';
// import Application from '../src/app/application';
// import axios from '../src/app/lib/axios';
import run from '../src/app/application';

const fixuturesPath = path.join(__dirname, '__fixtures__');
const getTree = () => html(document.body.innerHTML);

const initHtml = fs.readFileSync(path.join(fixuturesPath, 'index.html')).toString();
const pageRSSFeed = fs.readFileSync(path.join(fixuturesPath, 'pageRSSFeed.xml')).toString();

// const proxyUrl = 'https://cors-anywhere.herokuapp.com';
nock('https://cors-anywhere.herokuapp.com/http://localhost')
  .get('/feed')
  .reply(200, pageRSSFeed)
  .get('/wrong')
  .replyWithError('Not found')
  .get('/wrong')
  .replyWithError('Not found');


let container;
let input;
let form;
beforeEach(() => {
  document.documentElement.innerHTML = initHtml;
  run();
  container = document.getElementById('application');
  input = $(container).find('#input-rss');
  form = container.querySelector('#form');
});

test('Add correct channel and open modal', (done) => {
  input.val('http://localhost/feed');
  form.dispatchEvent(new Event('submit'));

  // TODO: надо что-то сделать, чтобы вызывать проверку без setTimeout
  setTimeout(() => {
    expect(getTree()).toMatchSnapshot();
    $('.open-post').first().trigger('click');
    setTimeout(() => {
      expect(getTree()).toMatchSnapshot();
      done();
    }, 300);
  }, 300);
});

test('Add wrong url', (done) => {
  input.val('');
  form.dispatchEvent(new Event('submit'));

  // TODO: надо что-то сделать, чтобы вызывать проверку без setTimeout
  setTimeout(() => {
    expect(getTree()).toMatchSnapshot();
    done();
  }, 300);
});

test('Show error', (done) => {
  input.val('http://localhost/wrong');
  form.dispatchEvent(new Event('submit'));

  // TODO: надо что-то сделать, чтобы вызывать проверку без setTimeout
  setTimeout(() => {
    expect(getTree()).toMatchSnapshot();
    done();
  }, 300);
});

test('Change language', (done) => {
  const ruButton = document.querySelector('.change-language[data-language="ru"]');
  ruButton.dispatchEvent(new Event('click'));
  input.val('http://localhost/wrong');
  form.dispatchEvent(new Event('submit'));

  // TODO: надо что-то сделать, чтобы вызывать проверку без setTimeout
  setTimeout(() => {
    expect(getTree()).toMatchSnapshot();
    done();
  }, 300);
});

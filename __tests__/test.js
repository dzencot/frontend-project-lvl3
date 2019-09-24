// @flow
/* global document */
import fs from 'fs';
import path from 'path';
import { html } from 'js-beautify';
import nock from 'nock';
import $ from 'jquery';
// import Application from '../src/app/application';
import run from '../src/app/run';

const fixuturesPath = path.join(__dirname, '__fixtures__');
const getTree = () => html(document.body.innerHTML);

const initHtml = fs.readFileSync(path.join(fixuturesPath, 'index.html')).toString();
const pageRSS = fs.readFileSync(path.join(fixuturesPath, 'pageRSS.html')).toString();
const pageRSSFeed = fs.readFileSync(path.join(fixuturesPath, 'pageRSSFeed.xml')).toString();
document.documentElement.innerHTML = initHtml;

beforeEach(() => {
  nock('http://localhost')
    .get('/')
    .reply(200, pageRSS)
    .get('/feed')
    .reply(200, pageRSSFeed);
});

test('Init', () => {
  run(false);
  expect(getTree()).toMatchSnapshot();
});

test('Input RSS', (done) => {
  run(false);
  const input = $('input');
  input.val('http://localhost');
  input.trigger('change');
  const submit = $('#add-rss');
  submit.trigger('mouseup');

  // TODO: надо что-то сделать, чтобы вызывать проверку без setTimeout
  setTimeout(() => {
    expect(getTree()).toMatchSnapshot();
    done();
  }, 2000);
});

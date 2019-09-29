// @flow
/* global document */
import fs from 'fs';
import path from 'path';
import { html } from 'js-beautify';
import nock from 'nock';
import $ from 'jquery';
// import Application from '../src/app/application';
// import axios from '../src/app/lib/axios';
import run from '../src/app/run';

const fixuturesPath = path.join(__dirname, '__fixtures__');
const getTree = () => html(document.body.innerHTML);

const initHtml = fs.readFileSync(path.join(fixuturesPath, 'index.html')).toString();
const pageRSSFeed = fs.readFileSync(path.join(fixuturesPath, 'pageRSSFeed.xml')).toString();
document.documentElement.innerHTML = initHtml;

// let application;

beforeEach(() => {
  nock('http://localhost')
    .get('/feed')
    .reply(200, pageRSSFeed);

  // const domParser = new DOMParser();
  // application = new Application(axios, domParser);
  run(false);
});

test('Init', () => {
  expect(getTree()).toMatchSnapshot();
});

test('Add wrong channel', (done) => {
  const input = $('input');
  input.val('');
  input.trigger('change');
  const submit = $('#add-rss');
  submit.trigger('mouseup');

  // TODO: надо что-то сделать, чтобы вызывать проверку без setTimeout
  setTimeout(() => {
    expect(getTree()).toMatchSnapshot();
    done();
  }, 100);


  // const event = {
  //   currentTarget: {
  //     value: '',
  //   },
  // };
  // application.onInput(event);
  // expect(getTree()).toMatchSnapshot();
});

test('Add correct channel and open modal', (done) => {
  const input = $('input');
  input.val('http://localhost/feed');
  input.trigger('change');
  const submit = $('#add-rss');
  submit.trigger('mouseup');

  // TODO: надо что-то сделать, чтобы вызывать проверку без setTimeout
  setTimeout(() => {
    expect(getTree()).toMatchSnapshot();
    $('.open-post').first().trigger('mouseup');
    setTimeout(() => {
      expect(getTree()).toMatchSnapshot();
      done();
    }, 100);
  }, 100);
});

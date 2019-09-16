// @flow
/* global document */
import fs from 'fs';
import path from 'path';
import { html } from 'js-beautify';
import init from '../src/app/init';

const fixuturesPath = path.join(__dirname, '__fixtures__');
const getTree = () => html(document.body.innerHTML);

beforeAll(() => {
  const initHtml = fs.readFileSync(path.join(fixuturesPath, 'index.html')).toString();
  document.documentElement.innerHTML = initHtml;
  init();
});

test('test', () => {
  expect(getTree()).toMatchSnapshot();
});

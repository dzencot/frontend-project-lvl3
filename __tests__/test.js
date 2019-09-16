// @flow
/* global document */
import fs from 'fs';
import path from 'path';
import { html } from 'js-beautify';
import run from '../src/app/run';

const fixuturesPath = path.join(__dirname, '__fixtures__');
const getTree = () => html(document.body.innerHTML);

beforeAll(() => {
  const initHtml = fs.readFileSync(path.join(fixuturesPath, 'index.html')).toString();
  document.documentElement.innerHTML = initHtml;
  run();
});

test('Init', () => {
  expect(getTree()).toMatchSnapshot();
});

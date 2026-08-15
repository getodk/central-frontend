/*
Tests are run in an iframe, which requires some setup.

The iframe is pretty small (300px x 150px), which is actually small enough to
cause test failures. By default, the iframe can't be resized using
window.resizeTo(). However, it can be resized using CSS. Below,
window.resizeTo() is overwritten to resize using CSS. testFile() will call
window.resizeTo() to increase the size of the iframe.

`npm run test` runs tests in a headless browser. On the other hand,
`npm run test:debug` opens a browser window. This file styles the page to
improve its look for when `npm run test:debug` is run.
*/

import { px } from '../../src/util/dom';

window.resizeTo = (width, height) => {
  Object.assign(window.frameElement.style, {
    width: px(width),
    height: px(height)
  });
};
window.resizeBy = () => { throw new Error('not implemented for iframe'); };

const parentDocument = window.parent.document;
parentDocument.body.style.backgroundColor = '#000';
// #vitest-ui doesn't seem to show anything and just takes up space.
parentDocument.querySelector('#vitest-ui').style.display = 'none';
window.frameElement.style.border = 'none';

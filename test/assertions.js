import chaiAsPromised from 'chai-as-promised';
import { Assertion, AssertionError, use, util } from 'chai';
import { BaseWrapper, VueWrapper } from '@vue/test-utils';

import { wait } from './util/util';

use(chaiAsPromised);

// addAsyncMethod() is similar to Assertion.addMethod(), but the specified
// function can be async.
const addAsyncMethod = (name, f) => { Assertion.prototype[name] = f; };

// Throws if the assertion was negated.
const noNegate = (assertion) => {
  if (util.flag(assertion, 'negate'))
    throw new Error('this assertion cannot be negated');
};
// Returns `true` if the assertion was negated and `false` if not. Throws if the
// assertion was called with arguments when it was negated.
const checkNegate = (assertion, args) => {
  const negate = util.flag(assertion, 'negate');
  if (negate && args.some(arg => arg != null))
    throw new Error('this negative assertion does not support arguments');
  return negate;
};



////////////////////////////////////////////////////////////////////////////////
// STRINGS

Assertion.addMethod('startWith', function startWith(str) {
  expect(this._obj).to.be.a('string');
  this.assert(
    this._obj.startsWith(str),
    'expected #{this} to start with #{exp}',
    'expected #{this} not to start with #{exp}',
    str
  );
});

Assertion.addMethod('endWith', function endWith(str) {
  expect(this._obj).to.be.a('string');
  this.assert(
    this._obj.endsWith(str),
    'expected #{this} to end with #{exp}',
    'expected #{this} not to end with #{exp}',
    str
  );
});

// Similar to match() in Should.js when called on a string.
Assertion.addMethod('stringMatch', function stringMatch(expected) {
  expect(this._obj).to.be.a('string');
  if (typeof expected === 'string') {
    this.assert(
      this._obj === expected,
      '#{this} to equal #{exp}',
      '#{this} not to equal #{exp}',
      expected
    );
  } else if (expected instanceof RegExp) {
    this.assert(
      expected.test(this._obj),
      '#{this} to match',
      '#{this} not to match'
    );
  } else if (typeof expected === 'function') {
    let match;
    try {
      match = expected(this._obj) !== false;
    } catch (error) {
      if (error instanceof AssertionError)
        match = false;
      else
        throw error;
    }
    this.assert(match, '#{this} to match', '#{this} not to match');
  } else {
    throw new Error('expected is invalid');
  }
});



////////////////////////////////////////////////////////////////////////////////
// DOM

// Takes an object that is either a native HTMLElement or a Vue Test Utils
// wrapper, then consistently returns an HTMLElement. If the object is a
// wrapper, its HTMLElement is returned.
const unwrapElement = (elementOrWrapper) => {
  if (elementOrWrapper instanceof HTMLElement) return elementOrWrapper;
  expect(elementOrWrapper).to.be.instanceof(BaseWrapper);
  const wrapper = elementOrWrapper;
  wrapper.exists().should.be.true;
  return wrapper.element;
};

const verifyAttached = (elementOrWrapper) => {
  if (!document.body.contains(unwrapElement(elementOrWrapper)))
    throw new Error('component must be attached to the body');
};

// Asserts that an element is not individually hidden and that all its ancestors
// are also not hidden. To test style-based visibility, attach the component to
// the document, and specify `true` for `computed`.
Assertion.addMethod('visible', function visible(computed = false) {
  if (computed) verifyAttached(this._obj);
  let element = unwrapElement(this._obj);
  while (element !== document.body && element != null) {
    const { display } = computed ? getComputedStyle(element) : element.style;
    this.assert(
      display !== 'none',
      'expected the element to be visible',
      'expected the element not to be visible'
    );
    element = element.parentNode;
  }
});

// Asserts that an element is individually hidden. To test style-based
// visibility, attach the component to the document, and specify `true` for
// `computed`.
Assertion.addMethod('hidden', function hidden(computed = false) {
  if (computed) verifyAttached(this._obj);
  const element = unwrapElement(this._obj);
  const { display } = computed ? getComputedStyle(element) : element.style;
  this.assert(
    display === 'none',
    'expected the element to be hidden',
    'expected the element not to be hidden'
  );
});

Assertion.addMethod('focused', function focused() {
  verifyAttached(this._obj);
  this.assert(
    unwrapElement(this._obj) === document.activeElement,
    'expected the element to be focused',
    'expected the element not to be focused'
  );
});

Assertion.addMethod('ariaDescription', function ariaDescription(description = undefined) {
  const element = unwrapElement(this._obj);
  const describedBy = element.getAttribute('aria-describedby');
  this.assert(
    describedBy != null,
    'expected the element to have an aria-describedby attribute',
    'expected the element not to have an aria-describedby attribute'
  );
  if (checkNegate(this, [description])) return;

  const ids = describedBy.split(' ');
  ids.length.should.equal(1);
  const id = ids[0];
  // Some components will not be attached to the body, yet will still end up
  // inserting elements into the DOM. (That happens with v-tooltip, for
  // example.) That's why we fall back to document.getElementById().
  const describer = element.getRootNode().querySelector(`#${id}`) ??
    document.getElementById(id);
  should.exist(describer);

  const text = describer.textContent.trim();
  if (description != null)
    text.should.stringMatch(description);
  else
    text.should.not.equal('');
});

Assertion.addMethod('ariaDescriptions', function ariaDescriptions(descriptions = undefined) {
  const element = unwrapElement(this._obj);
  const describedBy = element.getAttribute('aria-describedby');
  this.assert(
    describedBy != null,
    'expected the element to have an aria-describedby attribute',
    'expected the not to have an aria-describedby attribute'
  );
  if (checkNegate(this, [descriptions])) return;

  const ids = describedBy.split(' ');
  ids.length.should.be.above(1);
  const text = ids.map(id => {
    // See above for why we fall back to document.getElementById().
    const describer = element.getRootNode().querySelector(`#${id}`) ??
      document.getElementById(id);
    should.exist(describer);
    return describer.textContent.trim();
  });
  if (descriptions != null) {
    text.length.should.equal(descriptions.length);
    for (let i = 0; i < text.length; i += 1)
      text[i].should.stringMatch(descriptions[i]);
  } else {
    for (const s of text) s.should.not.equal('');
  }
});



////////////////////////////////////////////////////////////////////////////////
// TOOLTIPS

// Asserts that an element shows a tooltip on mouseenter and hides it on
// mouseleave. If `text` is specified, asserts that the text of the tooltip
// matches `text`.
addAsyncMethod('tooltip', async function tooltip(text = undefined) {
  document.querySelectorAll('.tooltip.in').length.should.equal(0);
  const element = unwrapElement(this._obj);
  element.dispatchEvent(new MouseEvent('mouseenter'));
  await wait();
  const tooltips = document.querySelectorAll('.tooltip.in');
  this.assert(
    tooltips.length !== 0,
    'expected the element to have a tooltip',
    'expected the element not to have a tooltip'
  );
  if (checkNegate(this, [text])) return;
  tooltips.length.should.equal(1);

  const actualText = tooltips[0].textContent.trim();
  if (text != null)
    actualText.should.stringMatch(text);
  else
    actualText.should.not.equal('');

  element.dispatchEvent(new MouseEvent('mouseleave'));
  document.querySelectorAll('.tooltip.in').length.should.equal(0);
});

/*
Asserts that an element shows the entirety of its text in a tooltip if and only
if its text is truncated. The assertion works by replacing the text with a long
string, checking that that shows a tooltip, then replacing the text with a short
string and checking that that does not show a tooltip. Note that this assertion
only tests horizontal truncation (text-overflow in CSS), not vertical truncation
(-webkit-line-clamp).

If the element does not truncate its text (by setting text-overflow) and does
not have an ancestor that truncates its text, the assertion will try to insert a
new ancestor to truncate its text. In other words, the assertion does not test
that the element has truncated text, only that if it has truncated text, it will
show that text in a tooltip. */
addAsyncMethod('textTooltip', async function textTooltip() {
  noNegate(this);

  const element = unwrapElement(this._obj);
  if (element.children.length !== 0)
    throw new Error('The element cannot have children because its content will be temporarily overwritten.');

  const root = element.getRootNode();
  if (root !== document)
    // The tooltip will check clientWidth, but clientWidth will be 0 unless
    // `element` is attached to the DOM. We also need `element` to be attached
    // to the DOM so that we can use getComputedStyle() below.
    document.body.append(root);

  // Find or create the element that sets the text-overflow CSS property.
  let overflowContainer = element;
  while (true) { // eslint-disable-line no-constant-condition
    const { textOverflow } = getComputedStyle(overflowContainer);
    if (textOverflow !== 'clip') break;
    overflowContainer = overflowContainer.parentNode;
    if (overflowContainer === document.body) break;
  }
  const hasContainer = overflowContainer !== document.body;
  if (!hasContainer) {
    if (root === document)
      throw new Error('The element does not have an ancestor that sets text-overflow. A new ancestor was not inserted because the element is already attached to the DOM.');
    overflowContainer = document.createElement('div');
    Object.assign(overflowContainer.style, {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    });
    root.remove();
    overflowContainer.append(root);
    document.body.append(overflowContainer);
  }

  const text = element.textContent;
  if (text.length <= 5)
    throw new Error('text of element must be more than 5 characters');
  element.textContent = 'a'.repeat(500);
  const containerOverflows = overflowContainer.clientWidth > window.innerWidth;
  try {
    // Make sure that overflowContainer does not itself overflow. Usually that
    // happens because the width or max-width of the container is set in an
    // ancestor component that has not been mounted. We don't want to require
    // that the ancestor component be mounted, so we will try to set max-width
    // ourselves.
    if (containerOverflows) {
      if (overflowContainer.style.maxWidth !== '')
        throw new Error('Could not prevent the element that sets text-overflow from itself overflowing. The element already sets max-width.');
      overflowContainer.style.maxWidth = `${window.innerWidth}px`;
      if (overflowContainer.clientWidth > window.innerWidth)
        throw new Error('Could not prevent the element that sets text-overflow from itself overflowing. You may need to mount a parent component, for example, a table instead of a row.');
    }

    await element.should.have.tooltip(element.textContent);
    element.textContent = 'aaaaaa';
    await element.should.not.have.tooltip();
  } finally {
    element.textContent = text;
    if (root !== document) root.remove();
    if (!hasContainer)
      overflowContainer.remove();
    else if (containerOverflows)
      overflowContainer.style.maxWidth = '';
  }
});



////////////////////////////////////////////////////////////////////////////////
// OTHER

Assertion.addMethod('alert', function assertAlert(type = undefined, message = undefined) {
  expect(this._obj).to.be.instanceof(VueWrapper);
  const { alert } = this._obj.vm.$container;
  this.assert(
    alert.state,
    'expected the component to show an alert',
    'expected the component not to show an alert'
  );
  if (checkNegate(this, [type, message])) return;
  if (type != null) alert.type.should.equal(type);
  if (message != null) alert.message.should.stringMatch(message);
});

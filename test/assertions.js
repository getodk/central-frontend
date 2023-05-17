import should from 'should';

import { wait } from './util/util';

const unwrapElement = (elementOrWrapper) => (elementOrWrapper instanceof HTMLElement
  ? elementOrWrapper
  : elementOrWrapper.element);

// Assertion.addSync() is like Assertion.add(), but the specified function can
// be async.
const { Assertion, AssertionError } = should;
Assertion.addAsync = (name, f) => {
  // Add a simple synchronous version of the assertion in order to surface
  // this.params and `name` if the assertion fails.
  const syncName = `${name}_`;
  // eslint-disable-next-line func-names
  Assertion.add(syncName, function(params, error = undefined) {
    if (params != null) this.params = params;
    if (error != null) throw error;
  });

  // eslint-disable-next-line func-names
  Assertion.prototype[name] = async function(...args) {
    // We will pass `context` to f() rather than `this` so that f() doesn't
    // mutate `this`.
    const context = { obj: this.obj };
    try {
      should.exist(this.obj);
      await f.apply(context, args);
    } catch (error) {
      if (!(error instanceof AssertionError)) throw error;
      if (this.negate) return this;
      // There has been an unexpected AssertionError, so the function will
      // return a rejected promise. Rather than re-throwing the AssertionError,
      // we pass the error to the synchronous version of the assertion above.
      this.obj.should[syncName](context.params, error);
    }
    if (this.negate) this.obj.should.not[syncName](context.params);
    return this;
  };
  // Name the function according to the specified name, since the function's
  // name will be shown in the stack trace.
  Object.defineProperty(Assertion.prototype[name], 'name', { value: name });
};

const verifyAttached = (elementOrWrapper) => {
  if (!document.body.contains(unwrapElement(elementOrWrapper)))
    throw new Error('component must be attached to the body');
};

// Asserts that an element is not individually hidden and that all its ancestors
// are also not hidden. To test style-based visibility, attach the component to
// the document, and specify `true` for `computed`.
Assertion.add('visible', function visible(computed = false) {
  this.params = { operator: 'to be visible' };
  if (computed) verifyAttached(this.obj);
  let element = unwrapElement(this.obj);
  while (element !== document.body && element != null) {
    const { display } = computed ? getComputedStyle(element) : element.style;
    display.should.not.equal('none');
    element = element.parentNode;
  }
});

// Asserts that an element is individually hidden. To test style-based
// visibility, attach the component to the document, and specify `true` for
// `computed`.
Assertion.add('hidden', function hidden(computed = false) {
  this.params = { operator: 'to be hidden' };
  if (computed) verifyAttached(this.obj);
  const element = unwrapElement(this.obj);
  const { display } = computed ? getComputedStyle(element) : element.style;
  display.should.equal('none');
});

// If a test does not attach the component to the document, then uses this
// assertion, it may time out rather than fail. (I am not sure why.)
Assertion.add('focused', function focused() {
  this.params = { operator: 'to be focused' };
  verifyAttached(this.obj);
  unwrapElement(this.obj).should.equal(document.activeElement);
});

Assertion.add('ariaDescription', function ariaDescription(description = undefined) {
  this.params = { operator: 'to be described by one element' };
  const element = unwrapElement(this.obj);
  const describedBy = element.getAttribute('aria-describedby');
  should.exist(describedBy);
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
    text.should.match(description);
  else
    text.should.not.equal('');
});

Assertion.add('ariaDescriptions', function ariaDescriptions(descriptions = undefined) {
  this.params = { operator: 'to be described by multiple elements' };
  const element = unwrapElement(this.obj);
  const describedBy = element.getAttribute('aria-describedby');
  should.exist(describedBy);
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
      text[i].should.match(descriptions[i]);
  } else {
    for (const s of text) s.should.not.equal('');
  }
});

// Asserts that an element shows a tooltip on mouseenter and hides it on
// mouseleave. If `text` is specified, asserts that the text of the tooltip
// matches `text`.
Assertion.addAsync('tooltip', async function tooltip(text = undefined) {
  this.params = { operator: 'to have a tooltip' };
  document.querySelectorAll('.tooltip.in').length.should.equal(0);
  const element = unwrapElement(this.obj);
  element.dispatchEvent(new MouseEvent('mouseenter'));
  await wait();
  const tooltips = document.querySelectorAll('.tooltip.in');
  tooltips.length.should.equal(1);
  const actualText = tooltips[0].textContent.trim();
  if (text != null)
    actualText.should.match(text);
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
Assertion.addAsync('textTooltip', async function textTooltip() {
  this.params = { operator: 'to show a tooltip if its text overflows' };

  const element = unwrapElement(this.obj);
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

Assertion.add('alert', function assertAlert(type = undefined, message = undefined) {
  this.params = { operator: 'to show an alert' };
  const { alert } = this.obj.vm.$container;
  alert.state.should.be.true();
  if (type != null) alert.type.should.equal(type);
  if (message != null) alert.message.should.match(message);
});

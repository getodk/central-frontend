import should from 'should';
import { DOMWrapper, VueWrapper } from '@vue/test-utils';

const isWrapper = (value) =>
  value instanceof VueWrapper || value instanceof DOMWrapper;
const unwrapElement = (elementOrWrapper) =>
  (isWrapper(elementOrWrapper) ? elementOrWrapper.element : elementOrWrapper);

/*
Let's say an assertion fails for a Vue Test Utils wrapper:

  button.should.be.focused();

If that happens, then for some reason, things start going wrong. The following
warnings are logged, then Karma times out:

WARN LOG: '[intlify] Not supported 'formatter'.'
WARN LOG: '[intlify] Not supported 'preserveDirectiveContent'.'
WARN LOG: '[intlify] Not supported 'formatter'.'
WARN LOG: '[intlify] Not supported 'preserveDirectiveContent'.'

If the error is caught and logged, then the following warning is logged:

[Vue warn]: Avoid app logic that relies on enumerating keys on a component instance. The keys will be empty in production mode to avoid performance overhead.

To avoid that, the cleanAssertionError() function tries to remove Vue Test Utils
wrappers from a Should.js assertion error before it is thrown. The function also
tries to make the error less noisy if it is logged. (mockHttp() often ends up
logging assertion errors.)
*/
/* eslint-disable no-param-reassign */
const cleanAssertionError = (error) => {
  if (error.actual != null) {
    if (isWrapper(error.actual))
      error.actual = error.actual.element;
    else if (Array.isArray(error.actual) && error.actual.every(isWrapper))
      error.actual = error.actual.map(unwrapElement);
  }
  // This property can result in extra noise if the error is logged.
  delete error.assertion;
  if (error.previous != null) cleanAssertionError(error.previous);
};
/* eslint-enable no-param-reassign */
// Override Assertion.prototype.fail() so that it calls cleanAssertionError().
const { Assertion, AssertionError } = should;
const { fail } = Assertion.prototype;
Assertion.prototype.fail = function cleanFail(...args) {
  try {
    fail.apply(this, args);
  } catch (error) {
    if (error instanceof AssertionError) cleanAssertionError(error);
    throw error;
  }
};

const verifyAttached = (elementOrWrapper) => {
  if (!document.body.contains(unwrapElement(elementOrWrapper)))
    throw new Error('component must be attached to the body');
};

// Asserts that an element is not individually hidden and that all its ancestors
// are also not hidden. To test style-based visibility, attach the component to
// the document, and specify `true` for `computed`.
should.Assertion.add('visible', function visible(computed = false) {
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
should.Assertion.add('hidden', function hidden(computed = false) {
  this.params = { operator: 'to be hidden' };
  if (computed) verifyAttached(this.obj);
  const element = unwrapElement(this.obj);
  const { display } = computed ? getComputedStyle(element) : element.style;
  display.should.equal('none');
});

should.Assertion.add('focused', function focused() {
  this.params = { operator: 'to be focused' };
  verifyAttached(this.obj);
  unwrapElement(this.obj).should.equal(document.activeElement);
});

should.Assertion.add('alert', function assertAlert(type = undefined, message = undefined) {
  this.params = { operator: 'to show an alert' };
  const { alert } = this.obj.vm.$container;
  alert.state.should.be.true();
  if (type != null) alert.type.should.equal(type);
  if (message != null) alert.message.should.match(message);
});

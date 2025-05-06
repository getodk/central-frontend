// Common tests for a series of request-response cycles

import Modal from '../../../src/components/modal.vue';
import Spinner from '../../../src/components/spinner.vue';

import { relativeUrl } from '../request';

const assertRequestsMatch = (actual, expected) => {
  const { extended = false, ...expectedNormalized } = expected;
  if (expectedNormalized.headers == null) expectedNormalized.headers = {};
  if (extended) {
    expectedNormalized.headers = { ...expectedNormalized.headers };
    expectedNormalized.headers['X-Extended-Metadata'] = 'true';
  }

  (actual.method ?? 'GET').should.equal(expectedNormalized.method ?? 'GET');

  if (typeof expectedNormalized.url === 'function') {
    expectedNormalized.url.call(null, relativeUrl(actual.url));
  } else {
    actual.url.should.equal(expectedNormalized.url);
  }

  try {
    expect(actual.data).to.eql(expectedNormalized.data);
  } catch (error) {
    try {
      expect(JSON.stringify(actual.data)).to.equal(JSON.stringify(expectedNormalized.data));
    } catch (_) {
      throw error;
    }
  }

  const { headers: expectedHeaders = {} } = expectedNormalized;
  (actual.headers ?? {}).should.eql(expectedHeaders);
};

export function testRequests(expectedConfigs) {
  let count = 0;
  return this
    .beforeEachResponse((component, config, i) => {
      count += 1;

      // If i >= expectedConfigs.length, then there have been too many
      // requests, and the afterResponses() hook will throw an error. If
      // expectedConfigs[i] == null, the request is intentionally not checked
      // (presumably because it is checked elsewhere).
      if (i < expectedConfigs.length && expectedConfigs[i] != null)
        assertRequestsMatch(config, expectedConfigs[i]);
    })
    .afterResponses(() => {
      if (count !== expectedConfigs.length) {
        const messageActual = count === 1
          ? '1 request was sent'
          : `${count} requests were sent`;
        const messageExpected = expectedConfigs.length === 1
          ? '1 was expected'
          : `${expectedConfigs.length} were expected`;
        throw new Error(`${messageActual}, but ${messageExpected}`);
      }
    });
}

export function testRequestsInclude(expectedConfigs) {
  const matched = [];
  return this
    .beforeEachResponse((component, config) => {
      for (const [i, expected] of expectedConfigs.entries()) {
        if (matched.includes(i)) continue; // eslint-disable-line no-continue
        try {
          assertRequestsMatch(config, expected);
          matched.push(i);
          return;
        } catch (_) {}
      }
    })
    .afterResponses(() => {
      if (matched.length !== expectedConfigs.length)
        throw new Error('an expected request was not sent');
    });
}

// Tests that no request is sent.
export function testNoRequest(callback = undefined) {
  return this
    .modify(series => (callback != null ? series.request(callback) : series))
    .testRequests([]);
}

// Tests buttons that toggle a modal.
export function testModalToggles({
  // Modal component
  modal,
  // Selector for a button within the series' component that shows the modal
  show,
  // Selector for a button within the modal that hides the modal
  hide,
  // Function that responds to any requests that are sent when the modal is
  // shown
  respond = (series) => series
}) {
  if (typeof modal === 'string')
    throw new Error('modal must be a component, not a string');
  const getModal = (component) => (modal === Modal
    ? component.getComponent(Modal)
    : component.getComponent(modal).getComponent(Modal));
  return this
    // First, test that the show button actually shows the modal.
    .afterResponses(component => {
      component.getComponent(modal).props().state.should.be.false;
    })
    .request(component => component.get(show).trigger('click'))
    .modify(respond)
    .afterResponses(async (component) => {
      const m = getModal(component);
      m.props().state.should.be.true;

      // Next, test that `modal` listens for `hide` events from Modal.
      await m.get('.close').trigger('click');
      m.props().state.should.be.false;
    })
    // Finally, test that the hide button actually hides the modal.
    .request(component => component.get(show).trigger('click'))
    .modify(respond)
    .afterResponses(async (component) => {
      const m = getModal(component);
      m.props().state.should.be.true;
      await m.get(hide).trigger('click');
      m.props().state.should.be.false;
    });
}



////////////////////////////////////////////////////////////////////////////////
// STANDARD BUTTON THINGS

const assertStandardButton = (component, {
  button: buttonSelector,
  disabled: disabledSelectors,
  modal,
  spinner: hasSpinner,
  awaitingResponse,
  alert: showsAlert
}) => {
  const button = component.get(buttonSelector);
  (button.attributes('aria-disabled') === 'true').should.equal(awaitingResponse);

  const spinner = button.findComponent(Spinner);
  spinner.exists().should.equal(hasSpinner);
  if (hasSpinner) spinner.props().state.should.equal(awaitingResponse);

  for (const selector of disabledSelectors) {
    const wrapper = component.get(selector);
    const disabled = wrapper.element.tagName === 'A'
      ? wrapper.classes('disabled')
      : wrapper.attributes('aria-disabled') === 'true';
    disabled.should.equal(awaitingResponse);
  }

  if (modal != null) {
    const parent = (modal === true ? component : component.getComponent(modal));
    parent.getComponent(Modal).props().hideable.should.equal(!awaitingResponse);
  }

  if (showsAlert)
    component.should.alert('danger');
  else
    component.should.not.alert();
};

// Tests the behavior of a component before, during, and after the click of a
// button that sends a request: tests some standard button things.
export function testStandardButton({
  // Selector for the button
  button,
  request = (component) => component.get(button).trigger('click'),
  // Selectors for additional actions that should be disabled during the request
  disabled = [],
  // Specifies a modal that should not be hideable during the request. If the
  // series' component is a modal, specify `true`. Otherwise, specify the modal
  // component.
  modal = undefined,
  // `true` if the button is expected to contain a spinner and `false` if not.
  spinner = true
}) {
  const assert = (awaitingResponse, alert) => (component) => {
    assertStandardButton(
      component,
      { button, disabled, modal, spinner, awaitingResponse, alert }
    );
  };
  let series = this;
  if (request != null) {
    series = series.request(component => {
      assert(false, false)(component);
      return request(component);
    });
  }
  return series
    .beforeAnyResponse(assert(true, false))
    .respondWithProblem()
    .afterResponse(assert(false, true));
}

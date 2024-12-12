// Common tests for a series of request-response cycles

import Modal from '../../../src/components/modal.vue';
import Spinner from '../../../src/components/spinner.vue';

import { relativeUrl } from '../request';
import { withAuth } from '../../../src/util/request';

export function testRequests(expectedConfigs) {
  let count = 0;
  return this
    .beforeEachResponse((component, config, i) => {
      count += 1;

      // If i >= expectedConfigs.length, then there have been too many
      // requests, and the afterResponses() hook will throw an error. If
      // expectedConfigs[i] == null, the request is intentionally not checked
      // (presumably because it is checked elsewhere).
      if (i < expectedConfigs.length && expectedConfigs[i] != null) {
        const { extended = false, ...expectedConfig } = expectedConfigs[i];
        (config.method ?? 'GET').should.equal(expectedConfig.method ?? 'GET');

        if (typeof expectedConfig.url === 'function') {
          expectedConfig.url.call(null, relativeUrl(config.url));
          // Replace expectedConfig.url now that config.url has passed
          // validation. This is needed because withAuth() expects the URL.
          expectedConfig.url = config.url;
        } else {
          config.url.should.equal(expectedConfig.url);
        }

        try {
          expect(config.data).to.eql(expectedConfig.data);
        } catch (error) {
          try {
            expect(JSON.stringify(config.data)).to.equal(JSON.stringify(expectedConfig.data));
          } catch (_) {
            throw error;
          }
        }

        if (extended) {
          expectedConfig.headers = {
            ...expectedConfig.headers,
            'X-Extended-Metadata': 'true'
          };
        }
        const token = component != null
          ? component.vm.$container.requestData.session.token
          : null;
        const { headers: expectedHeaders = {} } = withAuth(expectedConfig, token);
        (config.headers ?? {}).should.eql(expectedHeaders);
      }
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
  return this
    // First, test that the show button actually shows the modal.
    .afterResponses(component => {
      component.getComponent(modal).props().state.should.be.false;
    })
    .request(component => component.get(show).trigger('click'))
    .modify(respond)
    .afterResponses(async (component) => {
      const m = component.getComponent(modal);
      m.props().state.should.be.true;

      // Next, test that `modal` listens for `hide` events from Modal.
      await m.get('.close').trigger('click');
      m.props().state.should.be.false;
    })
    // Finally, test that the hide button actually hides the modal.
    .request(component => component.get(show).trigger('click'))
    .modify(respond)
    .afterResponses(async (component) => {
      const m = component.getComponent(modal);
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

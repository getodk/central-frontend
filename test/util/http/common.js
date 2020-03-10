// Common tests for a series of request-response cycles

import Modal from '../../../src/components/modal.vue';
import Spinner from '../../../src/components/spinner.vue';
import { trigger } from '../event';

// Tests that no request is sent.
export function testNoRequest(callback = undefined) {
  return callback != null
    ? this.request(callback).complete()
    : this.complete();
}

// Tests buttons that toggle a modal.
export function testModalToggles(
  modalComponent,
  // A button within the series' component that shows the modal
  showButtonSelector,
  // A button within the modal that hides the modal
  hideButtonSelector
) {
  return this.afterResponses(component => {
    const modal = component.first(modalComponent);
    // First, test that the show button actually shows the modal.
    modal.getProp('state').should.be.false();
    return trigger.click(component, showButtonSelector)
      .then(() => {
        modal.getProp('state').should.be.true();
        // Next, test that modalComponent listens for `hide` events from Modal.
        return trigger.click(modal, '.close');
      })
      .then(() => {
        modal.getProp('state').should.be.false();
        // Finally, test that the hide button actually hides the modal.
        return trigger.click(component, showButtonSelector);
      })
      .then(() => {
        modal.getProp('state').should.be.true();
        return trigger.click(modal, hideButtonSelector);
      })
      .then(() => {
        modal.getProp('state').should.be.false();
      });
  });
}



////////////////////////////////////////////////////////////////////////////////
// STANDARD BUTTON THINGS

const assertStandardButton = (
  component,
  buttonSelector,
  disabledSelectors,
  modal,
  awaitingResponse,
  showsAlert
) => {
  const button = component.first(buttonSelector);
  button.element.disabled.should.equal(awaitingResponse);

  const spinners = component.find(Spinner)
    .filter(spinner => $.contains(button.element, spinner.vm.$el));
  spinners.length.should.equal(1);
  spinners[0].getProp('state').should.equal(awaitingResponse);

  for (const selector of disabledSelectors)
    component.first(selector).element.disabled.should.equal(awaitingResponse);

  if (modal != null) {
    const parent = (modal === true ? component : component.first(modal));
    parent.first(Modal).getProp('hideable').should.equal(!awaitingResponse);
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
  request = trigger.click(button),
  // Selectors for additional buttons that should be disabled during the request
  disabled = [],
  // Specifies a modal that should not be hideable during the request. If the
  // series' component is a modal, specify `true`. Otherwise, specify the modal
  // component.
  modal = undefined
}) {
  const assert = (awaitingResponse, showsModal) => (component) =>
    assertStandardButton(component, button, disabled, modal, awaitingResponse, showsModal);
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

// Deprecated
export function standardButton(button = 'button[type="submit"]') {
  return this.testStandardButton({ button, request: null });
}

// Common tests for a series of request-response cycles

import Modal from '../../../src/components/modal.vue';
import Spinner from '../../../src/components/spinner.vue';

// Tests that no request is sent.
export function testNoRequest(callback = undefined) {
  return callback != null
    ? this.request(callback).complete()
    : this.complete();
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
      component.getComponent(modal).props().state.should.be.false();
    })
    .request(component => component.get(show).trigger('click'))
    .modify(respond)
    .afterResponses(async (component) => {
      const m = component.getComponent(modal);
      m.props().state.should.be.true();

      // Next, test that `modal` listens for `hide` events from Modal.
      await m.get('.close').trigger('click');
      m.props().state.should.be.false();
    })
    // Finally, test that the hide button actually hides the modal.
    .request(component => component.get(show).trigger('click'))
    .modify(respond)
    .afterResponses(async (component) => {
      const m = component.getComponent(modal);
      m.props().state.should.be.true();
      await m.get(hide).trigger('click');
      m.props().state.should.be.false();
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
  const button = component.get(buttonSelector);
  button.element.disabled.should.equal(awaitingResponse);

  const spinners = component.findAllComponents(Spinner).filter(spinner =>
    button.element.contains(spinner.element));
  spinners.length.should.equal(1);
  spinners.at(0).props().state.should.equal(awaitingResponse);

  for (const selector of disabledSelectors)
    component.get(selector).element.disabled.should.equal(awaitingResponse);

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

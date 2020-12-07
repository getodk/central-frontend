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
export function testModalToggles(...args) {
  if (args.length > 1) {
    return this.testModalToggles({
      modal: args[0],
      show: args[1],
      hide: args[2]
    });
  }
  const {
    // Modal component
    modal,
    // Selector for a button within the series' component that shows the modal
    show,
    // Selector for a button within the modal that hides the modal
    hide,
    // Function that responds to any requests that are sent when the modal is
    // shown
    respond = (series) => series
  } = args[0];

  return this
    // First, test that the show button actually shows the modal.
    .afterResponses(component => {
      component.first(modal).getProp('state').should.be.false();
    })
    .request(trigger.click(show))
    .modify(respond)
    .afterResponses(async (component) => {
      const m = component.first(modal);
      m.getProp('state').should.be.true();

      // Next, test that `modal` listens for `hide` events from Modal.
      await trigger.click(m, '.close');
      m.getProp('state').should.be.false();
    })
    // Finally, test that the hide button actually hides the modal.
    .request(trigger.click(show))
    .modify(respond)
    .afterResponses(async (component) => {
      const m = component.first(modal);
      m.getProp('state').should.be.true();
      await trigger.click(m, hide);
      m.getProp('state').should.be.false();
    });
}

export function testRefreshButton({
  button,
  table,
  collection,
  respondWithData = [() => collection.sorted()]
}) {
  const testRowCount = (component) => {
    const tables = component.find(table);
    if (tables.length === 0) throw new Error('table not found');
    if (tables.length > 1) throw new Error('multiple tables found');
    const rowCount = tables[0].find('tbody tr').length;
    rowCount.should.equal(collection.size);
  };

  // Series 1: Test that the table is initially rendered as expected.
  return this
    .afterResponses(testRowCount)
    // Series 2: Click the refresh button and return a successful response (or
    // responses). The table should not disappear during the refresh, and it
    // should be updated afterwards.
    .request(trigger.click(button))
    .modify(series => {
      collection.createNew();
      return respondWithData.reduce(
        (acc, callback) => acc.respondWithData(callback),
        series
      );
    })
    .beforeEachResponse(testRowCount)
    .afterResponses(testRowCount)
    // Series 3: Click the refresh button again, this time returning a Problem
    // response (or responses).
    .request(trigger.click(button))
    .modify(series => respondWithData.reduce(
      (acc) => acc.respondWithProblem(),
      series
    ))
    .afterResponses(component => {
      // The table should not disappear.
      testRowCount(component);
      component.should.alert();
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

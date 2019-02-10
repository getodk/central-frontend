import should from 'should';

import Alert from '../lib/components/alert.vue';

// Returns the element for an object that may be an avoriaz wrapper.
const element = (elementOrWrapper) => {
  if (elementOrWrapper.isVueComponent === true) return elementOrWrapper.vm.$el;
  return elementOrWrapper.element != null
    ? elementOrWrapper.element
    : elementOrWrapper;
};

should.Assertion.add('visible', function visible() {
  this.params = { operator: 'to be visible' };
  element(this.obj).style.display.should.equal('');
});

should.Assertion.add('hidden', function hidden() {
  this.params = { operator: 'to be hidden' };
  element(this.obj).style.display.should.equal('none');
});

// If a test does not attach the component to the document, then uses this
// assertion, it may time out rather than fail. (I am not sure why.)
should.Assertion.add('focused', function focused() {
  this.params = { operator: 'to be focused' };
  element(this.obj).should.equal(document.activeElement);
});

should.Assertion.add('alert', function assertAlert(type = null, message = null) {
  const alert = this.obj.first(Alert);
  alert.getProp('state').should.be.true();
  if (type != null) alert.getProp('type').should.equal(type);
  if (message != null) alert.getProp('message').should.equal(message);
});

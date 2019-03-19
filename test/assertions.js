import should from 'should';

import Alert from '../lib/components/alert.vue';

// Returns the element for an object that may be an avoriaz wrapper.
const unwrapElement = (elementOrWrapper) => {
  if (elementOrWrapper.isVueComponent === true) return elementOrWrapper.vm.$el;
  return elementOrWrapper.element != null
    ? elementOrWrapper.element
    : elementOrWrapper;
};

should.Assertion.add('visible', function visible() {
  this.params = { operator: 'to be visible' };
  unwrapElement(this.obj).style.display.should.equal('');
});

should.Assertion.add('hidden', function hidden() {
  this.params = { operator: 'to be hidden' };
  unwrapElement(this.obj).style.display.should.equal('none');
});

// If a test does not attach the component to the document, then uses this
// assertion, it may time out rather than fail. (I am not sure why.)
should.Assertion.add('focused', function focused() {
  this.params = { operator: 'to be focused' };
  unwrapElement(this.obj).should.equal(document.activeElement);
});

should.Assertion.add('alert', function assertAlert(type = undefined, message = undefined) {
  const alert = this.obj.first(Alert);
  alert.vm.$el.style.display.should.equal('');
  if (type != null) alert.hasClass(`alert-${type}`).should.be.true();
  if (message != null)
    alert.first('.alert-message').text().should.equal(message);
});

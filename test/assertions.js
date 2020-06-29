import should from 'should';

import Alert from '../src/components/alert.vue';
import { unwrapElement } from './util/util';

should.Assertion.add('visible', function visible() {
  this.params = { operator: 'to be visible' };
  let element = unwrapElement(this.obj);
  while (element !== document.body && element != null) {
    element.style.display.should.not.equal('none');
    element = element.parentNode;
  }
});

should.Assertion.add('hidden', function hidden() {
  this.params = { operator: 'to be hidden' };
  unwrapElement(this.obj).style.display.should.equal('none');
});

should.Assertion.add('disabled', function assertDisabled() {
  this.params = { operator: 'to be disabled' };
  const element = unwrapElement(this.obj);
  const disabled = element.disabled === true ||
    element.classList.contains('disabled');
  disabled.should.be.true();
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

import should from 'should';

const unwrapElement = (elementOrWrapper) => (elementOrWrapper instanceof HTMLElement
  ? elementOrWrapper
  : elementOrWrapper.element);

// Asserts that an element is not individually hidden and that all its ancestors
// are also not hidden. To test style-based visibility, attach the component to
// the document, and specify `true` for `computed`.
should.Assertion.add('visible', function visible(computed = false) {
  this.params = { operator: 'to be visible' };
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
  const element = unwrapElement(this.obj);
  const { display } = computed ? getComputedStyle(element) : element.style;
  display.should.equal('none');
});

// If a test does not attach the component to the document, then uses this
// assertion, it may time out rather than fail. (I am not sure why.)
should.Assertion.add('focused', function focused() {
  this.params = { operator: 'to be focused' };
  unwrapElement(this.obj).should.equal(document.activeElement);
});

should.Assertion.add('alert', function assertAlert(type = undefined, message = undefined) {
  this.params = { operator: 'to show an alert' };
  const { alert } = this.obj.vm.$container;
  alert.state.should.be.true();
  if (type != null) alert.type.should.equal(type);
  if (message != null) alert.message.should.match(message);
});

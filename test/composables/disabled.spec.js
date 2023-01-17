import sinon from 'sinon';

import useDisabled from '../../src/composables/disabled';

import { mount } from '../util/lifecycle';

const mountComponent = (template) => {
  const handler = sinon.fake();
  const setup = () => {
    useDisabled();
    return { handler };
  };
  const component = mount(
    { template, setup },
    { attachTo: document.body }
  );
  return [component, handler];
};

describe('useDisabled()', () => {
  // Set up access to the most recently triggered event so that we can check
  // whether preventDefault() was called on it.
  let event;
  const storeEvent = (e) => { event = e; };
  const toggleEventListeners = (add) => {
    const method = add ? 'addEventListener' : 'removeEventListener';
    document[method]('click', storeEvent, true);
  };
  before(() => { toggleEventListeners(true); });
  after(() => { toggleEventListeners(false); });

  it('disables a link that has the disabled class', () => {
    const [component, handler] = mountComponent(`<div>
      <a @click="handler">Enabled</a>
      <a class="disabled" @click="handler">Disabled</a>
    </div>`);
    const a = component.findAll('a');

    a[0].trigger('click');
    event.defaultPrevented.should.be.false();
    handler.callCount.should.equal(1);

    a[1].trigger('click');
    event.defaultPrevented.should.be.true();
    handler.callCount.should.equal(1);
  });

  it('disables a .disabled link for a click inside the link', () => {
    const [component, handler] = mountComponent(`<a class="disabled" @click="handler">
      <span class="icon-question-circle></span>
    </a>`);
    component.get('span').trigger('click');
    event.defaultPrevented.should.be.true();
    handler.callCount.should.equal(0);
  });

  it('disables a link in a disabled tab', () => {
    const [component, handler] = mountComponent(`<ul class="nav nav-tabs">
      <li role="presentation"><a @click="handler">Enabled</a></li>
      <li class="disabled" role="presentation"><a @click="handler">Disabled</a></li>
    </ul>`);
    const a = component.findAll('a');

    a[0].trigger('click');
    event.defaultPrevented.should.be.false();
    handler.callCount.should.equal(1);

    a[1].trigger('click');
    event.defaultPrevented.should.be.true();
    handler.callCount.should.equal(1);
  });
});

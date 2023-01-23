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
    for (const type of ['click', 'beforeinput', 'mousedown', 'keydown'])
      document[method](type, storeEvent, true);
  };
  before(() => { toggleEventListeners(true); });
  after(() => { toggleEventListeners(false); });

  it('disables a button that has the attribute aria-disabled="true"', () => {
    const [component, handler] = mountComponent(`<div>
      <button type="button" @click="handler">Enabled</button>
      <button type="button" aria-disabled="false" @click="handler">Enabled</button>
      <button type="button" aria-disabled="true" @click="handler">Disabled</button>
    </div>`);
    const buttons = component.findAll('button');

    buttons[0].trigger('click');
    event.defaultPrevented.should.be.false();
    handler.callCount.should.equal(1);

    buttons[1].trigger('click');
    event.defaultPrevented.should.be.false();
    handler.callCount.should.equal(2);

    buttons[2].trigger('click');
    event.defaultPrevented.should.be.true();
    handler.callCount.should.equal(2);
  });

  it('disables an aria-disabled button for a click inside the button', () => {
    const [component, handler] = mountComponent(`<button type="button"
      aria-disabled="true" @click="handler">
      <span class="icon-plus-circle"></span>
    </button>`);
    component.get('span').trigger('click');
    event.defaultPrevented.should.be.true();
    handler.callCount.should.equal(0);
  });

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
      <span class="icon-question-circle"></span>
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

  it('disables input for <input> element with aria-disabled="true"', () => {
    const [component, handler] = mountComponent(`<div>
      <input @beforeinput="handler">
      <input aria-disabled="false" @beforeinput="handler">
      <input aria-disabled="true" @beforeinput="handler">
    </div>`);
    const inputs = component.findAll('input');

    inputs[0].trigger('beforeinput');
    event.defaultPrevented.should.be.false();
    handler.callCount.should.equal(1);

    inputs[1].trigger('beforeinput');
    event.defaultPrevented.should.be.false();
    handler.callCount.should.equal(2);

    inputs[2].trigger('beforeinput');
    event.defaultPrevented.should.be.true();
    handler.callCount.should.equal(2);
  });

  it('disables mousedown for <select> element with aria-disabled="true"', () => {
    const [component, handler] = mountComponent(`<div>
      <select @mousedown="handler"></select>
      <select aria-disabled="false" @mousedown="handler"></select>
      <select aria-disabled="true" @mousedown="handler"></select>
    </div>`);
    const selects = component.findAll('select');

    selects[0].trigger('mousedown');
    event.defaultPrevented.should.be.false();
    handler.callCount.should.equal(1);

    selects[1].trigger('mousedown');
    event.defaultPrevented.should.be.false();
    handler.callCount.should.equal(2);

    selects[2].trigger('mousedown');
    event.defaultPrevented.should.be.true();
    handler.callCount.should.equal(2);
  });

  for (const key of [' ', 'ArrowDown', 'ArrowUp']) {
    // eslint-disable-next-line no-loop-func
    it(`disables keydown of '${key}' for <select> with aria-disabled="true"`, () => {
      const [component, handler] = mountComponent(`<div>
        <select @keydown="handler"></select>
        <select aria-disabled="false" @keydown="handler"></select>
        <select aria-disabled="true" @keydown="handler"></select>
      </div>`);
      const selects = component.findAll('select');

      selects[0].trigger('keydown', { key });
      event.defaultPrevented.should.be.false();
      handler.callCount.should.equal(1);

      selects[1].trigger('keydown', { key });
      event.defaultPrevented.should.be.false();
      handler.callCount.should.equal(2);

      selects[2].trigger('keydown', { key });
      event.defaultPrevented.should.be.true();
      handler.callCount.should.equal(2);
    });
  }
});

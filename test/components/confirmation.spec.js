import Confirmation from '../../src/components/confirmation.vue';

import { mergeMountOptions, mount } from '../util/lifecycle';
import { assertStandardButton } from '../util/http/common';

const mountComponent = (options = undefined) =>
  mount(Confirmation, mergeMountOptions(options, {
    props: { state: true, title: 'Some Title' },
    slots: {
      body: { template: '<p>Some text</p>' }
    }
  }));

describe('Confirmation', () => {
  it('shows the title', () => {
    const text = mountComponent().get('.modal-title').text();
    text.should.equal('Some Title');
  });

  it('shows the body', () => {
    const text = mountComponent().get('.modal-introduction').text();
    text.should.equal('Some text');
  });

  it('shows default text for yes button', () => {
    const text = mountComponent().get('.btn-danger').text();
    text.should.equal('Yes');
  });

  it('shows default text for no button', () => {
    const text = mountComponent().get('.btn-link').text();
    text.should.equal('No');
  });

  it('shows passed text for yes button', () => {
    const text = mountComponent({ props: { yesText: 'Custom Yes Text' } }).get('.btn-danger').text();
    text.should.equal('Custom Yes Text');
  });

  it('shows default text for no button', () => {
    const text = mountComponent({ props: { noText: 'Custom No Text' } }).get('.btn-link').text();
    text.should.equal('Custom No Text');
  });

  it('should not hide on ESC when awaitingResponse', async () => {
    const component = mountComponent({ props: { awaitingResponse: true } });
    await component.trigger('keydown.esc');
    component.emitted().should.not.have.property('hide');
  });

  it('should disable all action buttons when awaitingResponse', async () => {
    const component = mountComponent({ props: { awaitingResponse: true } });
    assertStandardButton(component, '.btn-danger', ['.btn-link', '.close'], null, true);
  });

  it('should emit success on yes button', async () => {
    const component = mountComponent();
    await component.get('.btn-danger').trigger('click');
    component.emitted().should.have.property('success');
  });
});

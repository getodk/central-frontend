import Confirmation from '../../src/components/confirmation.vue';

import useRequest from '../../src/composables/request';
import { noop } from '../../src/util/util';

import { mergeMountOptions, mount } from '../util/lifecycle';
import { mockHttp } from '../util/http';

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
    const text = mountComponent().get('.btn-primary').text();
    text.should.equal('Yes');
  });

  it('shows default text for no button', () => {
    const text = mountComponent().get('.btn-link').text();
    text.should.equal('No');
  });

  it('shows passed text for yes button', () => {
    const text = mountComponent({ props: { yesText: 'Custom Yes Text' } }).get('.btn-primary').text();
    text.should.equal('Custom Yes Text');
  });

  it('shows passed text for no button', () => {
    const text = mountComponent({ props: { noText: 'Custom No Text' } }).get('.btn-link').text();
    text.should.equal('Custom No Text');
  });

  it('should emit success on yes button', async () => {
    const component = mountComponent();
    await component.get('.btn-primary').trigger('click');
    component.emitted().should.have.property('success');
  });

  it('implements some standard button things', () => {
    const Parent = {
      template: `<confirmation :state="true" title="Some Title"
        :awaiting-response="awaitingResponse" @success="deleteProject"/>`,
      components: { Confirmation },
      setup() {
        const { request, awaitingResponse } = useRequest();
        const deleteProject = () => {
          request({ method: 'DELETE', url: '/v1/projects/1' }).catch(noop);
        };
        return { deleteProject, awaitingResponse };
      }
    };
    return mockHttp()
      .mount(Parent)
      .testStandardButton({
        button: '.btn-primary',
        disabled: ['.btn-link'],
        modal: Confirmation
      });
  });
});

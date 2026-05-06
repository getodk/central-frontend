import EntityUploadPopup from '../../../../src/components/entity/upload/popup.vue';

import { mergeMountOptions, mount } from '../../../util/lifecycle';

const mountComponent = (options = undefined) =>
  mount(EntityUploadPopup, mergeMountOptions(options, {
    props: { filename: 'my_data.csv', count: 1, warnings: 0, progress: 0 }
  }));

describe('EntityUploadPopup', () => {
  it('shows the filename', async () => {
    const div = mountComponent().get('#entity-upload-popup-heading div');
    div.text().should.equal('my_data.csv');
    await div.should.have.textTooltip();
  });

  it('emits a clear event if the clear button is clicked', async () => {
    const component = mountComponent();
    await component.get('.btn-link').trigger('click');
    component.emitted().clear.should.eql([[]]);
  });

  it('shows the count', () => {
    const component = mountComponent({
      props: { count: 1000 }
    });
    const text = component.get('#entity-upload-popup-count').text();
    text.should.equal('1,000 data rows found');
  });

  describe('warnings', () => {
    it('shows the count of warnings', () => {
      const component = mountComponent({
        props: { warnings: 5 }
      });
      const warnings = component.get('#entity-upload-popup-warnings');
      warnings.should.be.visible();
      warnings.text().should.equal('5 warnings');
    });

    it('does not show the count if it is 0', () => {
      mountComponent().get('#entity-upload-popup-warnings').should.be.hidden();
    });
  });

  it('hides elements during a request', () => {
    const component = mountComponent({
      props: { warnings: 1, awaitingResponse: true }
    });
    component.get('.btn-link').should.be.hidden();
    component.get('#entity-upload-popup-warnings').should.be.hidden();
  });

  describe('request status', () => {
    it('does not show a status if there is no request', () => {
      const component = mountComponent({
        props: { awaitingResponse: false }
      });
      component.get('#entity-upload-popup-status').should.be.hidden();
    });

    it('shows the status during a request', () => {
      const component = mountComponent({
        props: { awaitingResponse: true }
      });
      component.get('#entity-upload-popup-status').should.be.visible();
    });

    it('shows the upload progress', () => {
      const component = mountComponent({
        props: { awaitingResponse: true, progress: 0.5 }
      });
      const text = component.get('#entity-upload-popup-status').text();
      text.should.equal('Sending file… (50%)');
    });

    it('changes the status once all data has been sent', () => {
      const component = mountComponent({
        props: { awaitingResponse: true, progress: 1 }
      });
      const text = component.get('#entity-upload-popup-status').text();
      text.should.equal('Processing file…');
    });
  });
});

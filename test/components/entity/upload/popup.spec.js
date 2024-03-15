import EntityUploadPopup from '../../../../src/components/entity/upload/popup.vue';

import { mergeMountOptions, mount } from '../../../util/lifecycle';

const mountComponent = (options = undefined) =>
  mount(EntityUploadPopup, mergeMountOptions(options, {
    props: { filename: 'my_data.csv', count: 1, progress: 0 }
  }));

describe('EntityUploadPopup', () => {
  it('shows the filename', async () => {
    const div = mountComponent().get('#entity-upload-popup-heading div');
    div.text().should.equal('my_data.csv');
    await div.should.have.textTooltip();
  });

  describe('clear button', () => {
    it('emits a clear event if it is clicked', async () => {
      const component = mountComponent();
      await component.get('.close').trigger('click');
      component.emitted().clear.should.eql([[]]);
    });

    it('is hidden if the awaitingResponse prop is true', () => {
      const component = mountComponent({
        props: { awaitingResponse: true }
      });
      component.get('.close').should.be.hidden();
    });
  });

  it('shows the count', () => {
    const component = mountComponent({
      props: { count: 1000 }
    });
    const text = component.get('#entity-upload-popup-count').text();
    text.should.equal('1,000 data rows found');
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

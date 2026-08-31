import EntityUploadPopup from '../../../../src/components/entity/upload/popup.vue';

import { mergeMountOptions, mount } from '../../../util/lifecycle';

const mountComponent = (options = undefined) =>
  mount(EntityUploadPopup, mergeMountOptions(options, {
    props: { filename: 'my_data.csv', count: 1, progress: 0 }
  }));

describe('EntityUploadPopup', () => {
  it('shows the filename', async () => {
    const div = mountComponent().get('#entity-upload-popup-heading');
    div.text().should.equal('my_data.csv');
    await div.should.have.textTooltip();
  });

  it('shows the count', () => {
    const component = mountComponent({
      props: { count: 1000 }
    });
    const text = component.get('#entity-upload-popup-count').text();
    text.should.equal('1,000 data rows found');
  });

  describe('request status', () => {
    it('shows the upload progress', () => {
      const component = mountComponent({
        props: { progress: 0.5 }
      });
      const text = component.get('#entity-upload-popup-status').text();
      text.should.equal('Sending file… (50%)');
    });

    it('changes the status once all data has been sent', () => {
      const component = mountComponent({
        props: { progress: 1 }
      });
      const text = component.get('#entity-upload-popup-status').text();
      text.should.equal('Processing file…');
    });
  });
});

import CollectQr from '../../../src/components/collect-qr.vue';
import FormDraftQrPanel from '../../../src/components/form-draft/qr-panel.vue';

import testData from '../../data';
import { mockRouter } from '../../util/router';
import { mount } from '../../util/lifecycle';

const mountComponent = () => {
  const formDraft = testData.extendedFormDrafts.last();
  return mount(FormDraftQrPanel, {
    global: {
      provide: { projectId: 1, xmlFormId: 'f' }
    },
    container: {
      router: mockRouter('/projects/1/forms/f/draft/testing'),
      requestData: { formDraft }
    }
  });
};

describe('FormDraftQrPanel', () => {
  it('shows a QR code that encodes the correct settings', () => {
    testData.extendedForms.createPast(1, { name: 'My Form', draft: true });
    const component = mountComponent();
    const { draftToken } = testData.extendedFormDrafts.last();
    component.getComponent(CollectQr).props().settings.should.eql({
      general: {
        server_url: `http://localhost:9876/v1/test/${draftToken}/projects/1/forms/f/draft`,
        form_update_mode: 'match_exactly',
        autosend: 'wifi_and_cellular'
      },
      project: { name: '[Draft] My Form', icon: '📝' },
      admin: {}
    });
  });
});

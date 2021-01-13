import CollectQr from '../../../src/components/collect-qr.vue';
import FieldKeyQrPanel from '../../../src/components/field-key/qr-panel.vue';

import FieldKey from '../../../src/presenters/field-key';
import testData from '../../data';
import { mount } from '../../util/lifecycle';

const mountComponent = (propsData) => mount(FieldKeyQrPanel, {
  propsData: {
    fieldKey: new FieldKey(testData.extendedFieldKeys.last()),
    ...propsData
  }
});

describe('FieldKeyQrPanel', () => {
  beforeEach(() => {
    testData.extendedFieldKeys.createPast(1, { displayName: 'My App User' });
  });

  describe('QR code', () => {
    it('shows a managed QR code with the correct data', () => {
      const panel = mountComponent({ managed: true });
      const { token } = testData.extendedFieldKeys.last();
      panel.first(CollectQr).getProp('settings').should.eql({
        server_url: `/v1/key/${token}/projects/1`,
        form_update_mode: 'match_exactly',
        autosend: 'wifi_and_cellular'
      });
    });

    it('shows a legacy QR code with the correct data', () => {
      const panel = mountComponent({ managed: false });
      const { token } = testData.extendedFieldKeys.last();
      panel.first(CollectQr).getProp('settings').should.eql({
        server_url: `/v1/key/${token}/projects/1`
      });
    });
  });

  describe('text', () => {
    it('shows the correct text for a managed QR code', () => {
      const panel = mountComponent({ managed: true });
      const title = panel.first('.panel-title').text().trim();
      title.should.equal('Client Configuration Code');
      const body = panel.first('p').text().trim();
      body.should.startWith('This is a Managed QR Code.');
      body.should.containEql('Collect will exactly match the Forms available to “My App User”');
      body.should.containEql('For the old behavior,');
    });

    it('shows the correct text for a legacy QR code', () => {
      const panel = mountComponent({ managed: false });
      const title = panel.first('.panel-title').text().trim();
      title.should.equal('Legacy Client Configuration Code');
      const body = panel.first('p').text().trim();
      body.should.startWith('This is a Legacy QR Code.');
      body.should.containEql('Users will have to manually Get Blank Forms');
      body.should.containEql('For a more controlled and foolproof process,');
    });
  });

  it('adds a class for a legacy QR code', () => {
    mountComponent({ managed: false }).hasClass('legacy').should.be.true();
  });
});

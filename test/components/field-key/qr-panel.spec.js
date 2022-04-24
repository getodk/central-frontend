import CollectQr from '../../../src/components/collect-qr.vue';
import FieldKeyQrPanel from '../../../src/components/field-key/qr-panel.vue';

import testData from '../../data';
import { mount } from '../../util/lifecycle';

const mountComponent = (props) => mount(FieldKeyQrPanel, {
  props: { fieldKey: testData.extendedFieldKeys.last(), ...props },
  container: {
    requestData: { project: testData.extendedProjects.last() }
  }
});

describe('FieldKeyQrPanel', () => {
  beforeEach(() => {
    testData.extendedProjects.createPast(1, { name: 'My Project' });
    testData.extendedFieldKeys.createPast(1, { displayName: 'My App User' });
  });

  describe('QR code', () => {
    it('shows a managed QR code with the correct data', () => {
      const panel = mountComponent({ managed: true });
      const { token } = testData.extendedFieldKeys.last();
      panel.getComponent(CollectQr).props().settings.should.eql({
        general: {
          server_url: `http://localhost:9876/v1/key/${token}/projects/1`,
          form_update_mode: 'match_exactly',
          autosend: 'wifi_and_cellular'
        },
        project: { name: 'My Project' },
        admin: {}
      });
    });

    it('shows a legacy QR code with the correct data', () => {
      const panel = mountComponent({ managed: false });
      const { token } = testData.extendedFieldKeys.last();
      panel.getComponent(CollectQr).props().settings.should.eql({
        general: {
          server_url: `http://localhost:9876/v1/key/${token}/projects/1`
        },
        project: { name: 'My Project' },
        admin: {}
      });
    });
  });

  describe('text', () => {
    it('shows the correct text for a managed QR code', () => {
      const panel = mountComponent({ managed: true });
      const title = panel.get('.panel-title').text();
      title.should.equal('Client Configuration Code');
      const body = panel.get('p').text();
      body.should.startWith('This is a Managed QR Code.');
      body.should.containEql('Collect will exactly match the Forms available to “My App User”');
      body.should.containEql('For the old behavior,');
    });

    it('shows the correct text for a legacy QR code', () => {
      const panel = mountComponent({ managed: false });
      const title = panel.get('.panel-title').text();
      title.should.equal('Legacy Client Configuration Code');
      const body = panel.get('p').text();
      body.should.startWith('This is a Legacy QR Code.');
      body.should.containEql('Users will have to manually Get Blank Forms');
      body.should.containEql('For a more controlled and foolproof process,');
    });
  });

  it('adds a class for a legacy QR code', () => {
    mountComponent({ managed: false }).classes('legacy').should.be.true();
  });
});

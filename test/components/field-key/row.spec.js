import DateTime from '../../../src/components/date-time.vue';
import FieldKeyRow from '../../../src/components/field-key/row.vue';
import TimeAndUser from '../../../src/components/time-and-user.vue';
import testData from '../../data';
import { collectQrData } from '../../util/collect-qr';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';
import { trigger } from '../../util/event';

describe('FieldKeyRow', () => {
  beforeEach(() => {
    mockLogin({ displayName: 'Alice' });
    testData.extendedProjects.createPast(1, { appUsers: 1 });
  });

  it('shows the display name', () => {
    testData.extendedFieldKeys.createPast(1, { displayName: 'My App User' });
    return load('/projects/1/app-users').then(app => {
      const text = app.first(FieldKeyRow).first('td').text().trim();
      text.should.equal('My App User');
    });
  });

  it('renders the Created column correctly', () => {
    const { createdAt } = testData.extendedFieldKeys.createPast(1).last();
    return load('/projects/1/app-users').then(app => {
      const timeAndUser = app.first(FieldKeyRow).first(TimeAndUser);
      timeAndUser.getProp('iso').should.equal(createdAt);
      timeAndUser.getProp('user').displayName.should.equal('Alice');
    });
  });

  it('shows lastUsed', () => {
    const now = new Date().toISOString();
    testData.extendedFieldKeys.createPast(1, { lastUsed: now });
    return load('/projects/1/app-users').then(app => {
      app.first(FieldKeyRow).find(DateTime)[1].getProp('iso').should.equal(now);
    });
  });

  describe('QR code', () => {
    beforeEach(() => {
      testData.extendedFieldKeys.createPast(1);
    });

    it('is initially hidden', () =>
      load('/projects/1/app-users', { attachToDocument: true }, {}).then(() => {
        should.not.exist(document.querySelector('#field-key-list-popover-content'));
      }));

    it('is shown after the user clicks the link', () =>
      load('/projects/1/app-users', { attachToDocument: true }, {})
        .then(trigger.click('.field-key-row-popover-link'))
        .then(() => {
          should.exist(document.querySelector('#field-key-list-popover-content'));
        }));

    it('encodes the correct data', () =>
      load('/projects/1/app-users', { attachToDocument: true }, {})
        .then(trigger.click('.field-key-row-popover-link'))
        .then(() => {
          const img = document.querySelector('#field-key-list-popover-content img');
          const data = collectQrData(img);
          const { token } = testData.extendedFieldKeys.last();
          const url = `${window.location.origin}/v1/key/${token}/projects/1`;
          data.should.eql({
            general: { server_url: url },
            admin: {}
          });
        }));
  });

  it('indicates if access is revoked', () => {
    testData.extendedFieldKeys.createPast(1, { token: null });
    return load('/projects/1/app-users').then(app => {
      const text = app.first(FieldKeyRow).find('td')[3].text().trim();
      text.should.equal('Access revoked');
    });
  });
});

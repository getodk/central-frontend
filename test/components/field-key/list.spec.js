import testData from '../../data';
import { collectQrData } from '../../util/collect-qr';
import { formatDate } from '../../../src/util/date-time';
import { mockLogin } from '../../util/session';
import { mockRoute } from '../../util/http';
import { trigger } from '../../util/event';

describe('FieldKeyList', () => {
  beforeEach(mockLogin);

  describe('after login', () => {
    it('does not send a new request if user navigates back to tab', () =>
      mockRoute('/projects/1/app-users')
        .respondWithData(() =>
          testData.extendedProjects.createPast(1, { appUsers: 0 }).last())
        .respondWithData(() => testData.extendedFieldKeys.sorted())
        .complete()
        .route('/projects/1/settings')
        .complete()
        .route('/projects/1/app-users')
        .testNoRequest());

    it('table contains the correct data', () =>
      mockRoute('/projects/1/app-users')
        .respondWithData(() =>
          testData.extendedProjects.createPast(1, { appUsers: 2 }).last())
        .respondWithData(() => testData.extendedFieldKeys.createPast(2).sorted())
        .afterResponses(app => {
          const tr = app.find('#field-key-list-table tbody tr');
          const fieldKeys = testData.extendedFieldKeys.sorted();
          tr.length.should.equal(fieldKeys.length);
          for (let i = 0; i < tr.length; i += 1) {
            const td = tr[i].find('td');
            td.length.should.equal(5);
            const fieldKey = fieldKeys[i];

            td[0].text().trim().should.equal(fieldKey.displayName);
            const createdAt = formatDate(fieldKey.createdAt);
            const createdBy = fieldKey.createdBy.displayName;
            td[1].text().trim().should.equal(`${createdAt} by ${createdBy}`);
            td[2].text().trim().should.equal(formatDate(fieldKey.lastUsed));
            // We test the Configure Client column below.
          }
        }));

    it('shows a message if there are no app users', () =>
      mockRoute('/projects/1/app-users')
        .respondWithData(() =>
          testData.extendedProjects.createPast(1, { appUsers: 0 }).last())
        .respondWithData(() => testData.extendedFieldKeys.createPast(0).sorted())
        .afterResponses(app => {
          app.find('.empty-table-message').length.should.equal(1);
        }));

    describe('QR code', () => {
      let app;
      beforeEach(() => mockRoute('/projects/1/app-users', { attachToDocument: true })
        .respondWithData(() =>
          testData.extendedProjects.createPast(1, { appUsers: 1 }).last())
        .respondWithData(() => testData.extendedFieldKeys
          .createPast(1)
          .sorted())
        .afterResponses(component => {
          app = component;
        }));

      it('is initially hidden', () => {
        $('#field-key-list-popover-content').length.should.equal(0);
      });

      describe('after click', () => {
        beforeEach(() =>
          trigger.click(app.first('.field-key-row-popover-link')));

        it('is shown', () => {
          $('#field-key-list-popover-content').length.should.equal(1);
        });

        it('contains the correct data', () => {
          const img = $('#field-key-list-popover-content img');
          const data = collectQrData(img[0]);
          const { token } = testData.extendedFieldKeys.first();
          const url = `${window.location.origin}/v1/key/${token}/projects/1`;
          data.should.eql({ general: { server_url: url }, admin: {} });
        });
      });
    });

    it('app user whose access is revoked is marked accordingly', () =>
      mockRoute('/projects/1/app-users')
        .respondWithData(() =>
          testData.extendedProjects.createPast(1, { appUsers: 1 }).last())
        .respondWithData(() =>
          testData.extendedFieldKeys.createPast(1, { token: null }).sorted())
        .afterResponses(app => {
          const td = app.find('#field-key-list-table td')[3];
          td.text().trim().should.equal('Access revoked');
        }));
  });
});

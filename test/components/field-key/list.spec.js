import jsQR from 'jsqr';
import { inflate } from 'pako/lib/inflate';

import FieldKeyList from '../../../lib/components/field-key/list.vue';
import testData from '../../data';
import { formatDate } from '../../../lib/util';
import { mockHttp, mockRoute } from '../../http';
import { mockLogin, mockRouteThroughLogin } from '../../session';
import { trigger } from '../../util';

describe('FieldKeyList', () => {
  describe('routing', () => {
    it('anonymous user is redirected to login', () =>
      mockRoute('/users/field-keys')
        .restoreSession(false)
        .afterResponse(app => app.vm.$route.path.should.equal('/login')));

    it('after login, user is redirected back', () =>
      mockRouteThroughLogin('/users/field-keys')
        .respondWithData(() => testData.extendedFieldKeys.createPast(1).sorted())
        .afterResponse(app => {
          app.vm.$route.path.should.equal('/users/field-keys');
        }));
  });

  describe('after login', () => {
    beforeEach(mockLogin);

    it('app users tab is active', () =>
      mockRoute('/users/field-keys')
        .respondWithData(() => testData.extendedFieldKeys.createPast(1).sorted())
        .afterResponse(app => {
          const tab = app.first('.nav-tabs > .active');
          const title = tab.first('a').text().trim();
          title.should.equal('App Users');
        }));

    it('table contains the correct data', () => {
      const fieldKeys = testData.extendedFieldKeys.createPast(2).sorted();
      return mockHttp()
        .mount(FieldKeyList)
        .respondWithData(() => fieldKeys)
        .afterResponse(page => {
          const tr = page.find('table tbody tr');
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
        });
    });

    it('shows a message if there are no app users', () =>
      mockHttp()
        .mount(FieldKeyList)
        .respondWithData(() => [])
        .afterResponse(component => {
          component.find('#field-key-list-empty-message').length.should.equal(1);
        }));

    describe('QR code', () => {
      let app;
      beforeEach(() => mockRoute('/users/field-keys', { attachToDocument: true })
        .respondWithData(() =>
          testData.extendedFieldKeys.createPast(1, 'withAccess').sorted())
        .afterResponse(component => {
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
          const width = img.attr('width');
          const height = img.attr('height');
          const canvas = $('<canvas></canvas>')
            .attr('width', width)
            .attr('height', height);
          const context = canvas[0].getContext('2d');
          context.drawImage(img[0], 0, 0);
          const imageData = context.getImageData(0, 0, width, height);
          const encoded = jsQR(imageData.data, width, height).data;
          const inflated = inflate(atob(encoded), { to: 'string' });
          const data = JSON.parse(inflated);
          const { token } = testData.extendedFieldKeys.first();
          const url = `${window.location.origin}/v1/key/${token}`;
          data.should.eql({ general: { server_url: url }, admin: {} });
        });
      });
    });

    it('app user whose access is revoked is marked accordingly', () =>
      mockHttp()
        .mount(FieldKeyList)
        .respondWithData(() =>
          testData.extendedFieldKeys.createPast(1, 'withAccessRevoked').sorted())
        .afterResponse(page => {
          const td = page.find('#field-key-list-table td')[3];
          td.text().trim().should.equal('Access revoked');
        }));
  });
});

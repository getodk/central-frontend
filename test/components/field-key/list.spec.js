/*
Copyright 2017 Super Adventure Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/nafundi/super-adventure/blob/master/NOTICE.

This file is part of Super Adventure. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of Super Adventure,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import jsQR from 'jsqr';
import { inflate } from 'pako/lib/inflate';

import FieldKeyList from '../../../lib/components/field-key/list.vue';
import mockHttp from '../../http';
import testData from '../../data';
import { mockLogin, mockRouteThroughLogin } from '../../session';
import { mockRoute, trigger } from '../../util';

describe('FieldKeyList', () => {
  describe('routing', () => {
    it('anonymous user is redirected to login', () =>
      mockRoute('/users/field-keys')
        .then(app => app.vm.$route.path.should.equal('/login')));

    it('after login, user is redirected back', () =>
      mockRouteThroughLogin('/users/field-keys')
        .respondWithData(() => testData.extendedFieldKeys.createPast(1).sorted())
        .afterResponse(app => {
          app.vm.$route.path.should.equal('/users/field-keys');
        }));
  });

  it('success message is shown after login', () =>
    mockRouteThroughLogin('/users/field-keys')
      .respondWithData(() => testData.extendedFieldKeys.createPast(1).sorted())
      .afterResponse(app => {
        app.should.alert('success');
      }));

  describe('after login', () => {
    beforeEach(mockLogin);

    it('field keys tab is active', () =>
      mockRoute('/users/field-keys')
        .respondWithData(() => testData.extendedFieldKeys.createPast(1).sorted())
        .afterResponse(app => {
          const tab = app.first('.nav-tabs > .active');
          const title = tab.first('a').text().trim();
          title.should.equal('Field Keys');
        }));

    it('table contains the correct data', () => {
      const fieldKeys = testData.extendedFieldKeys.createPast(2).sorted();
      return mockHttp()
        .mount(FieldKeyList)
        .respondWithData(() => fieldKeys)
        .afterResponse(page => {
          const tr = page.find('table tbody tr');
          tr.length.should.equal(2);
          for (let i = 0; i < tr.length; i += 1) {
            const td = tr[i].find('td');
            td.length.should.equal(5);
            td[0].text().trim().should.equal(fieldKeys[i].displayName);
            // We test the Auto-Configure column below.
          }
        });
    });

    it('shows a message if there are no field keys', () =>
      mockHttp()
        .mount(FieldKeyList)
        .respondWithData(() => [])
        .afterResponse(page => {
          const text = page.first('p').text().trim();
          text.should.startWith('There are no field keys yet.');
        }));

    describe('QR code', () => {
      let app;
      beforeEach(() => mockRoute('/users/field-keys', { attachToDocument: true })
        .respondWithData(() =>
          testData.extendedFieldKeys.createPast(1, 'active').sorted())
        .afterResponse(component => {
          app = component;
        }));

      it('is initially hidden', () => {
        $('#field-key-list-popover-content').length.should.equal(0);
      });

      describe('after click', () => {
        beforeEach(() =>
          trigger.click(app.first('.field-key-list-popover-link'), true));

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
          const url = `${window.location.origin}/api/v1/key/${token}`;
          data.should.eql({ general: { server_url: url }, admin: {} });
        });
      });
    });

    it('revoked field key is marked accordingly', () =>
      mockHttp()
        .mount(FieldKeyList)
        .respondWithData(() =>
          testData.extendedFieldKeys.createPast(1, 'revoked').sorted())
        .afterResponse(page => {
          const td = page.find('#field-key-list-table td')[3];
          td.text().trim().should.equal('Revoked');
        }));
  });
});

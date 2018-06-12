/*
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import BackupList from '../../../lib/components/backup/list.vue';
import BackupTerminate from '../../../lib/components/backup/terminate.vue';
import testData from '../../data';
import { mockHttp } from '../../http';
import { mockLogin } from '../../session';
import { trigger } from '../../util';

const openModal = (wrapper) =>
  trigger.click(wrapper.first('#backup-list-terminate-button'))
    .then(() => wrapper);
const confirmTerminate = (wrapper) =>
  trigger.click(wrapper.first('.btn-danger')).then(() => wrapper);

describe('BackupTerminate', () => {
  beforeEach(mockLogin);

  describe('modal', () => {
    it('is initially hidden', () =>
      mockHttp()
        .mount(BackupList)
        .respondWithData(() => testData.backups.createPast(1).last())
        .afterResponse(page => {
          page.first(BackupTerminate).getProp('state').should.be.false();
        }));

    it('opens after button click', () =>
      mockHttp()
        .mount(BackupList)
        .respondWithData(() => testData.backups.createPast(1).last())
        .afterResponse(openModal)
        .then(page => {
          page.first(BackupTerminate).getProp('state').should.be.true();
        }));
  });

  it('standard button thinking things', () =>
    mockHttp()
      .mount(BackupTerminate)
      .request(confirmTerminate)
      .standardButton('.btn-danger'));

  describe('after successful response', () => {
    let page;
    beforeEach(() => mockHttp()
      .mount(BackupList)
      .respondWithData(() => testData.backups.createPast(1).last())
      .afterResponse(component => {
        page = component;
      })
      .request(() => openModal(page).then(confirmTerminate))
      .respondWithSuccess());

    it('modal is hidden', () => {
      page.first(BackupTerminate).getProp('state').should.be.false();
    });

    it('backup status is updated', () => {
      page.data().backups.status.should.equal('notConfigured');
    });

    it('success message is shown', () => {
      page.should.alert('success');
    });
  });
});

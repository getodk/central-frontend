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
import BackupList from '../../../lib/components/backup/list.vue';
import testData from '../../data';
import { mockHttp, mockRoute } from '../../http';
import { mockLogin, mockRouteThroughLogin } from '../../session';

describe('BackupList', () => {
  describe('routing', () => {
    it('anonymous user is redirected to login', () =>
      mockRoute('/system/backups')
        .then(app => app.vm.$route.path.should.equal('/login')));

    it('after login, user is redirected back', () =>
      mockRouteThroughLogin('/system/backups')
        .respondWithProblem(404.1)
        .afterResponse(app => {
          app.vm.$route.path.should.equal('/system/backups');
        }));
  });

  it('success message is shown after login', () =>
    mockRouteThroughLogin('/system/backups')
      .respondWithProblem(404.1)
      .afterResponse(app => app.should.alert('success')));

  describe('after login', () => {
    beforeEach(mockLogin);

    describe('content', () => {
      const assertContent = (iconClass, summaryText, buttonText) => (page) => {
        const icon = page.first('#backup-list-status-icon-container span');
        const messageSummary = page.first('#backup-list-status-message p');
        const button = page.first('#backup-list-button-container button');
        icon.hasClass(iconClass).should.be.true();
        messageSummary.text().trim().should.equal(summaryText);
        button.text().trim().should.equal(buttonText);
      };

      it('is not configured', () =>
        mockHttp()
          .mount(BackupList)
          .respondWithProblem(404.1)
          .afterResponse(assertContent(
            'icon-question-circle',
            'Backups are not configured.',
            'Set up now'
          )));

      it('has no recent attempt and was recently set up', () =>
        mockHttp()
          .mount(BackupList)
          .respondWithData(() =>
            testData.backups.createNew(['noRecentAttempt', 'recentlySetUp']))
          .afterResponse(assertContent(
            'icon-check-circle',
            'The configured backup has not yet run.',
            'Terminate'
          )));

      it('has no recent attempt and was not recently set up', () =>
        mockHttp()
          .mount(BackupList)
          .respondWithData(() =>
            testData.backups.createNew(['noRecentAttempt', 'notRecentlySetUp']))
          .afterResponse(assertContent(
            'icon-times-circle',
            'Something is wrong!',
            'Terminate'
          )));

      it('latest recent attempt was a success', () =>
        mockHttp()
          .mount(BackupList)
          .respondWithData(() =>
            testData.backups.createNew('mostRecentAttemptWasSuccess'))
          .afterResponse(assertContent(
            'icon-check-circle',
            'Backup is working.',
            'Terminate'
          )));

      it('latest recent attempt was a failure', () =>
        mockHttp()
          .mount(BackupList)
          .respondWithData(() =>
            testData.backups.createNew('mostRecentAttemptWasFailure'))
          .afterResponse(assertContent(
            'icon-times-circle',
            'Something is wrong!',
            'Terminate'
          )));
    });
  });
});

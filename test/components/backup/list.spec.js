import BackupList from '../../../lib/components/backup/list.vue';
import testData from '../../data';
import { formatDate } from '../../../lib/util/util';
import { mockHttp, mockRoute } from '../../http';
import { mockLogin, mockRouteThroughLogin } from '../../session';

describe('BackupList', () => {
  describe('routing', () => {
    it('redirects an anonymous user to login', () =>
      mockRoute('/system/backups')
        .restoreSession(false)
        .afterResponse(app => {
          app.vm.$route.path.should.equal('/login');
        }));

    it('redirects the user back after login', () =>
      mockRouteThroughLogin('/system/backups')
        .respondWithProblem(404.1)
        .afterResponse(app => {
          app.vm.$route.path.should.equal('/system/backups');
        }));

    it('redirects a user without a grant to config.read', () => {
      mockLogin({ role: 'none' });
      return mockRoute('/system/backups')
        .respondWithData(() => testData.extendedProjects.createPast(1).sorted())
        .respondWithData(() => testData.standardUsers.sorted())
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/');
        });
    });
  });

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
        return page;
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

      it('latest recent attempt was a success', () =>
        mockHttp()
          .mount(BackupList)
          .respondWithData(() => testData.backups.createNew({
            latestRecentAttempt: { success: true }
          }))
          .afterResponse(assertContent(
            'icon-check-circle',
            'Backup is working.',
            'Terminate'
          ))
          .then(page => page
            .first('#backup-list-most-recently-logged-at')
            .text()
            .trim()
            .should
            .equal(formatDate(testData.backups.last().recent[0].loggedAt))));

      it('latest recent attempt was a failure', () =>
        mockHttp()
          .mount(BackupList)
          .respondWithData(() => testData.backups.createNew({
            latestRecentAttempt: { success: false }
          }))
          .afterResponse(assertContent(
            'icon-times-circle',
            'Something is wrong!',
            'Terminate'
          )));

      describe('no recent attempt for the current config', () => {
        it('renders correctly if the config was recently set up', () =>
          mockHttp()
            .mount(BackupList)
            .respondWithData(() => testData.backups.createNew({
              recentlySetUp: true, latestRecentAttempt: null
            }))
            .afterResponse(assertContent(
              'icon-check-circle',
              'The configured backup has not yet run.',
              'Terminate'
            )));

        it('renders correctly if the config was not recently set up', () =>
          mockHttp()
            .mount(BackupList)
            .respondWithData(() => testData.backups.createNew({
              recentlySetUp: false, latestRecentAttempt: null
            }))
            .afterResponse(assertContent(
              'icon-times-circle',
              'Something is wrong!',
              'Terminate'
            )));

        it('renders correctly if latest recent attempt for a previous config failed', () =>
          mockHttp()
            .mount(BackupList)
            .respondWithData(() => testData.backups.createNew({
              recentlySetUp: true,
              latestRecentAttempt: null,
              latestRecentAttemptForPrevious: { success: false }
            }))
            .afterResponse(assertContent(
              'icon-check-circle',
              'The configured backup has not yet run.',
              'Terminate'
            )));
      });
    });
  });
});

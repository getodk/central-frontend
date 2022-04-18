import AnalyticsIntroduction from '../../../src/components/analytics/introduction.vue';

import { ago } from '../../../src/util/date-time';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('AnalyticsIntroduction', () => {
  describe('analytics notice', () => {
    it('shows the notice if analytics are not configured', () => {
      testData.extendedUsers.createPast(1, {
        createdAt: ago({ days: 15 }).toISO()
      });
      return load('/account/edit', {}, false)
        .restoreSession()
        .respondWithProblem(404.1) // analyticsConfig
        .respondFor('/account/edit')
        .afterResponses(app => {
          app.find('#navbar-analytics-notice').should.be.visible();
        });
    });

    it('does not show the notice if analytics are configured', () => {
      testData.extendedUsers.createPast(1, {
        createdAt: ago({ days: 15 }).toISO()
      });
      const config = testData.standardConfigs
        .createPast(1, { key: 'analytics', value: { enabled: true } })
        .last();
      return load('/account/edit', {}, false)
        .restoreSession()
        .respondWithData(() => config)
        .respondFor('/account/edit')
        .afterResponses(app => {
          app.find('#navbar-analytics-notice').should.be.hidden();
        });
    });

    it('does not show the notice to a user without a sitewide role', () => {
      testData.extendedUsers.createPast(1, {
        role: 'none',
        createdAt: ago({ days: 15 }).toISO()
      });
      return load('/account/edit', {}, false)
        .restoreSession()
        .respondFor('/account/edit')
        .afterResponses(app => {
          app.find('#navbar-analytics-notice').should.be.hidden();
        });
    });

    it('does not show the notice to a recently created user', () => {
      testData.extendedUsers.createPast(1, {
        createdAt: ago({ days: 13 }).toISO()
      });
      return load('/account/edit', {}, false)
        .restoreSession()
        .respondWithProblem(404.1)
        .respondFor('/account/edit')
        .afterResponses(app => {
          app.find('#navbar-analytics-notice').should.be.hidden();
        });
    });

    it('does not show the notice if the showsAnalytics config is false', () => {
      testData.extendedUsers.createPast(1, {
        createdAt: ago({ days: 15 }).toISO()
      });
      const container = {
        config: { showsAnalytics: false }
      };
      return load('/account/edit', { container }, false)
        .restoreSession()
        .respondFor('/account/edit')
        .afterResponses(app => {
          app.find('#navbar-analytics-notice').should.be.hidden();
        });
    });
  });

  it('toggles the modal', () => {
    mockLogin({ createdAt: ago({ days: 15 }).toISO() });
    return load('/').testModalToggles({
      modal: AnalyticsIntroduction,
      show: '#navbar-analytics-notice',
      hide: '.btn-link'
    });
  });

  describe('after the "Improve Central" button is clicked', () => {
    beforeEach(() => {
      mockLogin({ createdAt: ago({ days: 15 }).toISO() });
    });

    it('navigates to /system/analytics', () =>
      load('/')
        .complete()
        .request(async (app) => {
          await app.get('#navbar-analytics-notice').trigger('click');
          return app.get('#analytics-introduction .btn-primary').trigger('click');
        })
        .respondFor('/system/analytics')
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/system/analytics');
        }));

    it('hides the modal', () =>
      load('/')
        .complete()
        .request(async (app) => {
          await app.get('#navbar-analytics-notice').trigger('click');
          return app.get('#analytics-introduction .btn-primary').trigger('click');
        })
        .respondFor('/system/analytics')
        .afterResponses(app => {
          const { state } = app.getComponent(AnalyticsIntroduction).props();
          state.should.be.false();
        }));
  });
});

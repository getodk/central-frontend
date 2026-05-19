import { mount } from '../util/lifecycle';
import OutdatedVersion from '../../src/components/outdated-version.vue';
import { mockLogin } from '../util/session';
import testData from '../data';
import { mockHttp } from '../util/http';
import { loadLocale } from '../../src/util/i18n';

const mountOptions = (options) => ({
  global: {
    provide: { visiblyLoggedIn: options.userLoggedIn ?? true }
  },
  container: {
    requestData: {
      centralVersion: {
        status: 200,
        data: options.centralVersion,
        headers: new Map([['date', options.currentDate ? new Date(options.currentDate) : new Date()]])
      }
    }
  }
});

const mountComponent = (options) => mount(OutdatedVersion, mountOptions(options));

describe('OutdatedVersionBanner', () => {
  const cases = [
    {
      description: 'user is not logged in',
      expectedResult: false, userLoggedIn: false, role: 'admin', centralVersion: '(v2022.1.2-sha)', currentDate: '2024-12-11', dismissDate: null
    },
    {
      description: 'user is not system wide admin',
      expectedResult: false, userLoggedIn: true, role: 'viewer', centralVersion: '(v2022.1.2-sha)', currentDate: '2024-12-11', dismissDate: null
    },
    {
      description: 'version is too old and there is no dismiss date',
      expectedResult: true, userLoggedIn: true, role: 'admin', centralVersion: '(v2022.1.2-sha)', currentDate: '2024-12-11', dismissDate: null
    },
    {
      description: 'version is too old and dismiss date is 30 days ago',
      expectedResult: true, userLoggedIn: true, role: 'admin', centralVersion: '(v2022.1.2-sha)', currentDate: '2024-12-11', dismissDate: '2024-11-10T12:00:00.000Z'
    },
    {
      description: 'version is too old but dismiss date is recent',
      expectedResult: false, userLoggedIn: true, role: 'admin', centralVersion: '(v2022.1.2-sha)', currentDate: '2024-12-11', dismissDate: '2024-12-01T12:00:00.000Z'
    },
    {
      description: 'version is not old',
      expectedResult: false, userLoggedIn: true, role: 'admin', centralVersion: '(v2024.1.2-sha)', currentDate: '2024-12-11', dismissDate: null
    }
  ];

  cases.forEach(c => {
    it(c.description, () => {
      if (c.userLoggedIn) {
        mockLogin({ role: c.role });
        const { preferences } = testData.extendedUsers.first();
        preferences.site.outdatedVersionWarningDismissDate = c.dismissDate;
        testData.extendedUsers.update(-1, { preferences });
      }
      const component = mountComponent(c);
      component.find('.outdated-version-banner').exists().should.equal(c.expectedResult);
    });
  });

  describe('dismiss button', () => {
    beforeEach(mockLogin);

    it('should go away on dismiss button', () => mockHttp()
      .mount(OutdatedVersion, mountOptions({ centralVersion: '(v2022.1.2-sha)', currentDate: '2024-12-11' }))
      .request((component) => {
        component.find('.outdated-version-banner').exists().should.be.true;
        return component.find('.btn-danger').trigger('click');
      })
      .respondWithSuccess()
      .afterResponses(component => {
        component.find('.outdated-version-banner').exists().should.be.false;
      }));

    it('updates the user preference', () => mockHttp()
      .mount(OutdatedVersion, mountOptions({ centralVersion: '(v2022.1.2-sha)', currentDate: '2024-12-11T00:00:00.000Z' }))
      .request((component) => component.find('.btn-danger').trigger('click'))
      .beforeEachResponse((_, { method, url, data }) => {
        method.should.equal('PUT');
        url.includes('/v1/user-preferences/site/outdatedVersionWarningDismissDate').should.be.true;
        data.propertyValue.should.be.equal('2024-12-11T00:00:00.000Z');
      })
      .respondWithSuccess());
  });

  describe('iframe src', () => {
    beforeEach(mockLogin);

    it('has the correct src', () => {
      const component = mountComponent({ centralVersion: '(v2022.1.2-sha)' });
      component.find('.outdated-version-banner').exists().should.equal(true);
      component.find('iframe').attributes().src.should.be.equal('https://getodk.github.io/central/outdated-version.html?version=2022.1.2&lang=en');
    });

    it('updates the lang in the iframe src', async () => {
      const component = mountComponent({ centralVersion: '(v2022.1.2-sha)' });
      component.find('.outdated-version-banner').exists().should.equal(true);
      await loadLocale(component.vm.$container, 'es');
      component.find('iframe').attributes().src.should.be.equal('https://getodk.github.io/central/outdated-version.html?version=2022.1.2&lang=es');
    });
  });
});

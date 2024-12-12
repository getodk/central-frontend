// write testStandardButton

import { mount } from '../util/lifecycle';
import OutdatedVersionBanner from '../../src/components/outdated-version-banner.vue';
import { mockLogin } from '../util/session';
import testData from '../data';

const mountComponent = (options) => mount(OutdatedVersionBanner, {
  container: {
    requestData: {
      centralVersion: {
        status: 200,
        data: options.centralVersion,
        headers: new Map([['date', new Date(options.currentDate)]])
      }
    }
  }
});

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
      expectedResult: true, userLoggedIn: true, role: 'admin', centralVersion: '(v2022.1.2-sha)', currentDate: '2024-12-11', dismissDate: '2024-11-10T12:00:00Z'
    },
    {
      description: 'version is too old but dismiss date is recent',
      expectedResult: false, userLoggedIn: true, role: 'admin', centralVersion: '(v2022.1.2-sha)', currentDate: '2024-12-11', dismissDate: '2024-12-01T12:00:00Z'
    },
    {
      description: 'version is not old',
      expectedResult: false, userLoggedIn: true, role: 'admin', centralVersion: '(v2024.1.2-sha)', currentDate: '2024-12-11', dismissDate: '2024-12-11T12:00:00Z'
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

  it('should go away on dismiss button', async () => {
    mockLogin();
    const component = mountComponent({ centralVersion: '(v2022.1.2-sha)', currentDate: '2024-12-11' });
    component.find('.outdated-version-banner').exists().should.be.true;
    await component.find('.btn-danger').trigger('click');
    component.find('.outdated-version-banner').exists().should.be.false;
  });
});

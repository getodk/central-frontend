import sinon from 'sinon';
import { watch } from 'vue';

import UserPreferences from '../../../src/request-data/user-preferences/preferences';

import createTestContainer from '../../util/container';
import testData from '../../data';
import { mockHttp } from '../../util/http';

const setupPreferences = (data = {}) => {
  const user = testData.extendedUsers.createNew({ preferences: data });
  const container = createTestContainer();
  const preferences = new UserPreferences(user.preferences, container);
  return { container, preferences };
};

describe('UserPreferences', () => {
  it('returns preferences that have been set', () => {
    const { preferences } = setupPreferences({
      site: { projectSortMode: 'alphabetical' },
      projects: {
        123: { formTrashCollapsed: true }
      }
    });
    preferences.site.projectSortMode.should.equal('alphabetical');
    preferences.projects[123].formTrashCollapsed.should.be.true;
  });

  it('returns an object for a project without preferences', () => {
    const { preferences } = setupPreferences();
    expect(preferences.projects[123]).to.be.an('object');
  });

  it('returns the same object each time for a project without preferences', () => {
    const { preferences } = setupPreferences();
    expect(preferences.projects[123]).to.equal(preferences.projects[123]);
  });

  it("returns default values for preferences that aren't set", () => {
    const { preferences } = setupPreferences();
    expect(preferences.site.projectSortMode).to.equal('latest');
    expect(preferences.projects[123].formTrashCollapsed).to.be.false;
  });

  it('normalizes a value before returning it', () => {
    const { preferences } = setupPreferences({
      projectSortMode: 'someOldModeThatIsNoLongerSupported'
    });
    preferences.site.projectSortMode.should.equal('latest');
  });

  describe('requests', () => {
    it('sends a PUT request after a site preference is set', () => {
      const { container, preferences } = setupPreferences({
        site: { projectSortMode: 'latest' }
      });
      return mockHttp(container)
        .request(() => {
          preferences.site.projectSortMode = 'alphabetical';
        })
        .respondWithSuccess()
        .testRequests([{
          method: 'PUT',
          url: '/v1/user-preferences/site/projectSortMode',
          data: { propertyValue: 'alphabetical' }
        }]);
    });

    it('sends a DELETE request after a site preference is deleted', () => {
      const { container, preferences } = setupPreferences({
        site: { projectSortMode: 'latest' }
      });
      return mockHttp(container)
        .request(() => {
          delete preferences.site.projectSortMode;
        })
        .respondWithSuccess()
        .testRequests([{
          method: 'DELETE',
          url: '/v1/user-preferences/site/projectSortMode'
        }]);
    });

    it('sends a PUT request after a project preference is set', () => {
      const { container, preferences } = setupPreferences({
        projects: {
          123: { formTrashCollapsed: false }
        }
      });
      return mockHttp(container)
        .request(() => {
          preferences.projects[123].formTrashCollapsed = true;
        })
        .respondWithSuccess()
        .testRequests([{
          method: 'PUT',
          url: '/v1/user-preferences/project/123/formTrashCollapsed',
          data: { propertyValue: true }
        }]);
    });

    it('sends a DELETE request after a project preference is deleted', () => {
      const { container, preferences } = setupPreferences({
        projects: {
          123: { formTrashCollapsed: false }
        }
      });
      return mockHttp(container)
        .request(() => {
          delete preferences.projects[123].formTrashCollapsed;
        })
        .respondWithSuccess()
        .testRequests([{
          method: 'DELETE',
          url: '/v1/user-preferences/project/123/formTrashCollapsed'
        }]);
    });

    it('updates the property immediately without regard for the response', () => {
      const { container, preferences } = setupPreferences({
        site: { projectSortMode: 'latest' }
      });
      return mockHttp(container)
        .request(() => {
          preferences.site.projectSortMode = 'alphabetical';
          preferences.site.projectSortMode.should.equal('alphabetical');
        })
        // Even if there is an error response, the property does not revert.
        .respondWithProblem()
        .afterResponse(() => {
          preferences.site.projectSortMode.should.equal('alphabetical');
        });
    });

    it('supports concurrent requests', () => {
      const { container, preferences } = setupPreferences();
      return mockHttp(container)
        .request(() => {
          preferences.site.projectSortMode = 'alphabetical';
          preferences.projects[123].formTrashCollapsed = true;
          preferences.projects[456].formTrashCollapsed = true;
        })
        .respondWithSuccess()
        .respondWithSuccess()
        .respondWithSuccess()
        .testRequests([
          {
            method: 'PUT',
            url: '/v1/user-preferences/site/projectSortMode',
            data: { propertyValue: 'alphabetical' }
          },
          {
            method: 'PUT',
            url: '/v1/user-preferences/project/123/formTrashCollapsed',
            data: { propertyValue: true }
          },
          {
            method: 'PUT',
            url: '/v1/user-preferences/project/456/formTrashCollapsed',
            data: { propertyValue: true }
          }
        ]);
    });
  });

  it('normalizes a value when setting it', () => {
    const { container, preferences } = setupPreferences({
      site: { projectSortMode: 'alphabetical' }
    });
    return mockHttp(container)
      .request(() => {
        // An unknown sort mode falls back to the default, which is 'latest'.
        preferences.site.projectSortMode = 'foo';
        preferences.site.projectSortMode.should.equal('latest');
      })
      .respondWithSuccess()
      .testRequests([{
        method: 'PUT',
        url: '/v1/user-preferences/site/projectSortMode',
        data: { propertyValue: 'latest' }
      }]);
  });

  it('triggers reactive effects', () => {
    const { container, preferences } = setupPreferences({
      site: { projectSortMode: 'latest' },
      projects: {
        123: { formTrashCollapsed: false }
      }
    });
    const fake = sinon.fake();
    watch(() => preferences.site.projectSortMode, fake);
    watch(() => preferences.projects[123].formTrashCollapsed, fake);
    // Project without preferences
    watch(() => preferences.projects[456].formTrashCollapsed, fake);
    return mockHttp(container)
      .request(() => {
        preferences.site.projectSortMode = 'alphabetical';
        preferences.projects[123].formTrashCollapsed = true;
        preferences.projects[456].formTrashCollapsed = true;
      })
      .respondWithSuccess()
      .respondWithSuccess()
      .respondWithSuccess()
      .afterResponses(() => {
        fake.callCount.should.equal(3);
      });
  });
});

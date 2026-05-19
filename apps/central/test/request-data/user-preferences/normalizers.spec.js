import UserPreferences from '../../../src/request-data/user-preferences/preferences';

import createTestContainer from '../../util/container';
import { mockHttp } from '../../util/http';

const setupPreferences = () => {
  const container = createTestContainer();
  const preferences = new UserPreferences({ site: {}, projects: {} }, container);
  return { container, preferences };
};

describe('user preference normalizers', () => {
  describe('site preferences', () => {
    const cases = {
      projectSortMode: [
        ['alphabetical', 'alphabetical'],
        ['latest', 'latest'],
        ['newest', 'newest'],
        [undefined, 'latest'],
        [null, 'latest'],
        ['foo', 'latest'],
        [1, 'latest'],
        [{ foo: 'bar' }, 'latest']
      ],
      outdatedVersionWarningDismissDate: [
        ['2025-01-02T12:34:56.789Z', '2025-01-02T12:34:56.789Z'],
        [new Date('2025-01-02T12:34:56.789Z'), '2025-01-02T12:34:56.789Z'],
        [undefined, null],
        [null, null],
        ['foo', null],
        [1, null],
        [{ foo: 'bar' }, null]
      ],
    };
    for (const [key, keyCases] of Object.entries(cases)) {
      describe(key, () => {
        for (const [raw, normalized] of keyCases) {
          it(`normalizes ${raw} as ${normalized}`, () => {
            const { container, preferences } = setupPreferences();
            return mockHttp(container)
              .request(() => {
                preferences.site[key] = raw;
              })
              .respondWithSuccess()
              .afterResponse(() => {
                expect(preferences.site[key]).to.equal(normalized);
              });
          });
        }
      });
    }
  });

  describe('project preferences', () => {
    const cases = {
      formTrashCollapsed: [
        [true, true],
        [false, false],
        [undefined, false],
        [null, false],
        ['foo', false],
        [1, false],
        [{ foo: 'bar' }, false]
      ],
    };
    for (const [key, keyCases] of Object.entries(cases)) {
      describe(key, () => {
        for (const [raw, normalized] of keyCases) {
          it(`normalizes ${raw} as ${normalized}`, () => {
            const { container, preferences } = setupPreferences();
            return mockHttp(container)
              .request(() => {
                preferences.projects[123][key] = raw;
              })
              .respondWithSuccess()
              .afterResponse(() => {
                expect(preferences.projects[123][key]).to.equal(normalized);
              });
          });
        }
      });
    }
  });
});

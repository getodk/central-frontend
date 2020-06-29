import i18n from '../../../src/i18n';
import { load } from '../../util/http';
import { loadLocale } from '../../../src/util/i18n';
import { trigger } from '../../util/event';
import { wait } from '../../util/util';

describe('NavbarLocaleDropdown', () => {
  it('shows the current locale', () =>
    load('/login').then(app => {
      const toggle = app.first('#navbar-locale-dropdown .dropdown-toggle');
      toggle.text().trim().should.equal('en');
    }));

  it('shows a menu item for each locale', () =>
    load('/login').then(app => {
      const text = app.find('#navbar-locale-dropdown .dropdown-menu a')
        .map(a => a.text().trim());
      text.should.eql(['English', 'Español']);
    }));

  describe('after a locale selection', () => {
    afterEach(() => loadLocale('en'));

    const selectLocale = () => load('/login')
      .afterResponses(app => {
        for (const a of app.find('#navbar-locale-dropdown .dropdown-menu a')) {
          if (a.text().trim() === 'Español')
            return trigger.click(a).then(() => app);
        }
        throw new Error('locale not found');
      });

    it('loads the locale', () =>
      selectLocale()
        // Wait for the locale to be loaded.
        .then(() => wait(100))
        .then(() => {
          i18n.locale.should.equal('es');
        }));

    it('shows the new locale', () =>
      selectLocale().then(app => {
        const toggle = app.first('#navbar-locale-dropdown .dropdown-toggle');
        toggle.text().trim().should.equal('es');
      }));

    it('saves the new locale in local storage', () =>
      selectLocale().then(() => {
        localStorage.getItem('locale').should.equal('es');
      }));
  });
});

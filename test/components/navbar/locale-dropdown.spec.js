import NavbarLocaleDropdown from '../../../src/components/navbar/locale-dropdown.vue';

import { load } from '../../util/http';
import { mount } from '../../util/lifecycle';
import { wait } from '../../util/util';

describe('NavbarLocaleDropdown', () => {
  it('shows the current locale', () => {
    const text = mount(NavbarLocaleDropdown).get('.dropdown-toggle').text();
    text.should.equal('en');
  });

  it('shows a menu item for each locale', () => {
    const text = mount(NavbarLocaleDropdown).findAll('.dropdown-menu a')
      .map(a => a.text());
    text.length.should.be.above(3);
    text[0].should.eql('English');
    text[1].should.eql('Čeština');
    text[2].should.eql('Deutsch');
  });

  describe('after a locale selection', () => {
    const selectLocale = () => load('/login')
      .restoreSession(false)
      .afterResponses(async (app) => {
        const a = app.findAll('#navbar-locale-dropdown .dropdown-menu a')
          .find(wrapper => wrapper.text() === 'Español');
        should.exist(a);
        await a.trigger('click');
        return app;
      });

    it('loads the locale', async () => {
      const app = await selectLocale();
      // Wait for the locale to be loaded.
      await wait(100);
      app.vm.$i18n.locale.should.equal('es');
    });

    it('shows the new locale', () =>
      selectLocale().then(app => {
        const toggle = app.get('#navbar-locale-dropdown .dropdown-toggle');
        toggle.text().should.equal('es');
      }));

    it('saves the new locale in local storage', () =>
      selectLocale().then(() => {
        localStorage.getItem('locale').should.equal('es');
      }));

    it('updates the page title based on the new locale', () =>
      selectLocale()
        .then(() => {
          // Log in screen
          document.title.should.equal('Ingresar | ODK Central');
        }));
  });
});

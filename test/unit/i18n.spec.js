import createCentralI18n from '../../src/i18n';
import { $tcn, loadLocale } from '../../src/util/i18n';

import createTestContainer from '../util/container';

describe('util/i18n', () => {
  describe('loadLocale()', () => {
    it('changes the locale', async () => {
      const container = createTestContainer();
      await loadLocale(container, 'es');
      const { i18n } = container;
      i18n.locale.should.equal('es');
      i18n.t('field.password').should.equal('Contraseña');
    });

    it('changes the lang attribute', async () => {
      await loadLocale(createTestContainer(), 'es');
      document.documentElement.getAttribute('lang').should.equal('es');
    });

    it('returns a rejected promise for a locale that is not supported', async () => {
      const container = createTestContainer();
      return loadLocale(container, 'la').should.be.rejectedWith('unknown locale');
    });
  });

  describe('pluralization rules', () => {
    // Array of test cases by locale
    const cases = {
      cs: ['plural.webUser', [
        [0, 'Webových uživatelů'],
        [1, 'Webový uživatel'],
        [2, 'Weboví uživatelé'],
        [3, 'Weboví uživatelé'],
        [4, 'Weboví uživatelé'],
        [5, 'Webových uživatelů'],
        [100, 'Webových uživatelů']
      ]]
    };
    for (const [locale, [path, casesForLocale]] of Object.entries(cases)) {
      describe(locale, () => {
        const container = createTestContainer();
        before(() => loadLocale(container, locale));

        const { i18n } = container;
        for (const [count, form] of casesForLocale) {
          it(`uses the correct form for ${count}`, () => {
            i18n.tc(path, count).should.equal(form);
          });
        }
      });
    }
  });

  describe('$tcn()', () => {
    const i18n = createCentralI18n();
    i18n.setLocaleMessage('la', {
      forms: '{count} Forma | {count} Formae',
      parts: '{name} est omnis divisa in partem {count}. | {name} est omnis divisa in partes {count}.'
    });
    i18n.locale = 'la';

    const i18nProps = { $tc: i18n.tc.bind(i18n), $n: i18n.n.bind(i18n), $tcn };

    it('returns the singular', () => {
      i18nProps.$tcn('forms', 1).should.equal('1 Forma');
    });

    it('returns the plural', () => {
      i18nProps.$tcn('forms', 1234).should.equal('1,234 Formae');
    });

    it('uses values', () => {
      const message = i18nProps.$tcn('parts', 3, { name: 'Gallia' });
      message.should.equal('Gallia est omnis divisa in partes 3.');
    });
  });
});

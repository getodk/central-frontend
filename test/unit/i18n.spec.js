import createCentralI18n from '../../src/i18n';
import { $tcn, loadLocale, useI18nUtils } from '../../src/util/i18n';

import createTestContainer from '../util/container';
import { withSetup } from '../util/lifecycle';

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
      const { documentElement } = document;
      documentElement.getAttribute('lang').should.equal('en');
      await loadLocale(createTestContainer(), 'es');
      documentElement.getAttribute('lang').should.equal('es');
    });

    it('returns a rejected promise for a locale that is not supported', () => {
      const result = loadLocale(createTestContainer(), 'la');
      return result.should.be.rejectedWith('unknown locale');
    });

    // Adding this test in case `locales` is changed from a Map to an object.
    it('returns a rejected promise for a property of Object.prototype', () => {
      const result = loadLocale(createTestContainer(), 'toString');
      return result.should.be.rejectedWith('unknown locale');
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
        beforeAll(() => loadLocale(container, locale));

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
    const i18n = createCentralI18n().global;
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
      i18nProps.$tcn('forms', 2).should.equal('2 Formae');
    });

    it('localizes the count', () => {
      i18nProps.$tcn('forms', 1234).should.equal('1,234 Formae');
    });

    it('uses values', () => {
      const message = i18nProps.$tcn('parts', 3, { name: 'Gallia' });
      message.should.equal('Gallia est omnis divisa in partes 3.');
    });
  });

  describe('useI18nUtils()', () => {
    describe('formatRange()', () => {
      it('returns a formatted range', () => {
        const { formatRange } = withSetup(useI18nUtils);
        formatRange(1000, 2000).should.equal('1,000–2,000');
      });

      it('returns a single number if start and end are the same', () => {
        const { formatRange } = withSetup(useI18nUtils);
        formatRange(1000, 1000).should.equal('1,000');
      });

      it('uses the locale', () => {
        const container = createTestContainer();
        const { formatRange } = withSetup(useI18nUtils, { container });
        container.i18n.locale = 'ja';
        formatRange(1000, 2000).should.equal('1,000～2,000');
      });

      it('accepts a number format key', () => {
        const { formatRange } = withSetup(useI18nUtils);
        formatRange(0.1, 0.2, 'percent').should.equal('10% – 20%');
      });
    });

    describe('formatList()', () => {
      it('returns a formatted list', () => {
        const { formatList } = withSetup(useI18nUtils);
        formatList(['x', 'y']).should.equal('x, y');
        formatList(['x', 'y', 'z']).should.equal('x, y, z');
      });

      it('uses the locale', () => {
        const container = createTestContainer();
        const { formatList } = withSetup(useI18nUtils, { container });
        container.i18n.locale = 'ja';
        formatList(['x', 'y']).should.equal('x、y');
        formatList(['x', 'y', 'z']).should.equal('x、y、z');
      });
    });

    describe('formatListToParts()', () => {
      it('returns a formatted list', () => {
        const { formatListToParts } = withSetup(useI18nUtils);
        formatListToParts(['x', 'y']).should.eql([
          { type: 'element', value: 'x' },
          { type: 'literal', value: ', ' },
          { type: 'element', value: 'y' }
        ]);
      });

      it('uses the locale', () => {
        const container = createTestContainer();
        const { formatListToParts } = withSetup(useI18nUtils, { container });
        container.i18n.locale = 'ja';
        formatListToParts(['x', 'y']).should.eql([
          { type: 'element', value: 'x' },
          { type: 'literal', value: '、' },
          { type: 'element', value: 'y' }
        ]);
      });
    });
  });
});

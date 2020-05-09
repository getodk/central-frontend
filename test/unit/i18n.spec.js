import AccountLogin from '../../src/components/account/login.vue';
import i18n from '../../src/i18n';
import { loadLocale, tS } from '../../src/util/i18n';
import { mockRoute } from '../util/http';

const silentTranslationWarn = () => {
  const original = i18n.silentTranslationWarn;
  i18n.silentTranslationWarn = true;
  return () => {
    i18n.silentTranslationWarn = original;
  };
};

describe('util/i18n', () => {
  describe('loadLocale()', () => {
    afterEach(() => {
      i18n.locale = 'en';
      document.querySelector('html').setAttribute('lang', 'en');
    });

    it('changes the locale', () =>
      loadLocale('es').then(() => {
        i18n.locale.should.equal('es');
        i18n.t('field.password').should.equal('Contraseña');
      }));

    it('changes the lang attribute', () =>
      loadLocale('es').then(() => {
        document.querySelector('html').getAttribute('lang').should.equal('es');
      }));

    it('throws an error for a locale that is not defined', () => {
      let thrown = false;
      return loadLocale('yi')
        .catch(() => {
          thrown = true;
        })
        .finally(() => {
          thrown.should.be.true();
        });
    });
  });

  describe('paths', () => {
    before(() => {
      i18n.setLocaleMessage('la', {
        resourceCount: {
          form: '1 Forma | {localeN} Formae'
        },
        action: {
          create: 'Crea',
          yesConfirm: 'Ita, certus sum'
        },
        component: {
          FormList: {
            title: 'Formae',
            action: {
              create: 'Novus'
            },
            alert: {
              create: 'Forma nova tua "{name}" creata est.'
            }
          }
        }
      });
      i18n.locale = 'la';
    });

    after(() => {
      i18n.locale = 'en';
    });

    describe('tS()', () => {
      it('returns a message if the path exists in the scope', () => {
        tS('component.FormList', 'title').should.equal('Formae');
      });

      it('falls back to root if path does not exist in scope', () => {
        const message = tS('component.FormList', 'action.yesConfirm');
        message.should.equal('Ita, certus sum');
      });

      it('does not fall back to root if path exists in fallback locale', () => {
        const message = tS('component.FieldKeyList', 'action.create');
        message.should.equal('Create App User');
      });

      it('prefers the scope to the root if the path exists in both', () => {
        tS('component.FormList', 'action.create').should.equal('Novus');
      });

      it('returns path if path does not exist in scope or at root', () => {
        const unsilent = silentTranslationWarn();
        tS('action', 'doesNotExist').should.equal('doesNotExist');
        unsilent();
      });

      it('uses values', () => {
        const message = tS('component.FormList', 'alert.create', { name: 'F' });
        message.should.equal('Forma nova tua "F" creata est.');
      });
    });

    // TODO
    describe('tc()', () => {});
    describe('te()', () => {});
    describe('tcPath()', () => {});
  });

  describe('Vue.prototype', () => {
    describe('$i18nScope', () => {
      it('returns the correct scope', () =>
        mockRoute('/')
          .restoreSession(false)
          .afterResponse(app => {
            const scope = app.first(AccountLogin).vm.$i18nScope;
            scope.should.equal('component.AccountLogin');
          }));
    });

    describe('$tPath()', () => {
      it('returns a scoped path', () =>
        mockRoute('/')
          .restoreSession(false)
          .afterResponse(app => {
            const path = app.first(AccountLogin).vm.$tPath('title');
            path.should.equal('component.AccountLogin.title');
          }));
    });
  });
});

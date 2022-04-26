import PublicLinkCreate from '../../../src/components/public-link/create.vue';
import PublicLinkRevoke from '../../../src/components/public-link/revoke.vue';

import testData from '../../data';
import { load, mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';

const mountOptions = () => ({
  props: { state: true, publicLink: testData.standardPublicLinks.last() }
});

describe('PublicLinkRevoke', () => {
  beforeEach(() => {
    mockLogin();
    testData.standardPublicLinks.createPast(1, {
      displayName: 'My Public Link',
      token: 'a'.repeat(64)
    });
  });

  it('toggles the modal', () =>
    load('/projects/1/forms/f/public-links', { root: false }).testModalToggles({
      modal: PublicLinkRevoke,
      show: '.public-link-row .btn-danger',
      hide: '.btn-link'
    }));

  it('sends the correct request', () =>
    mockHttp()
      .mount(PublicLinkRevoke, mountOptions())
      .request(modal => modal.get('.btn-danger').trigger('click'))
      .beforeEachResponse((_, { method, url }) => {
        method.should.equal('DELETE');
        url.should.equal(`/v1/sessions/${'a'.repeat(64)}`);
      })
      .respondWithProblem());

  it('implements some standard button things', () =>
    mockHttp()
      .mount(PublicLinkRevoke, mountOptions())
      .testStandardButton({
        button: '.btn-danger',
        disabled: ['.btn-link'],
        modal: true
      }));

  describe('after a successful response', () => {
    const revoke = (series) => series
      .request(async (app) => {
        await app.get('.public-link-row .btn-danger').trigger('click');
        await app.get('#public-link-revoke .btn-danger').trigger('click');
      })
      .respondWithData(() => {
        testData.standardPublicLinks.update(-1, { token: null });
        return { success: true };
      })
      .respondWithData(() => testData.standardPublicLinks.sorted());

    it('shows a success alert', () =>
      load('/projects/1/forms/f/public-links')
        .complete()
        .modify(revoke)
        .afterResponses(app => {
          app.should.alert('success', (message) => {
            message.should.containEql('My Public Link');
          });
        }));

    it('indicates that the public link has been revoked', () =>
      load('/projects/1/forms/f/public-links')
        .complete()
        .modify(revoke)
        .afterResponses(app => {
          const text = app.get('.public-link-row .access-link').text();
          text.should.equal('Revoked');
        }));

    it('no longer highlights a new public link', () =>
      load('/projects/1/forms/f/public-links')
        .complete()
        .request(async (app) => {
          await app.get('.heading-with-button .btn-primary').trigger('click');
          const modal = app.getComponent(PublicLinkCreate);
          modal.get('input').setValue('Another Value');
          return modal.get('form').trigger('submit');
        })
        .respondWithData(() => testData.standardPublicLinks.createNew({
          displayName: 'Another Link'
        }))
        .respondWithData(() => testData.standardPublicLinks.sorted())
        .complete()
        .modify(revoke)
        .afterResponses(app => {
          app.find('.public-link-row.success').exists().should.be.false();
        }));
  });
});

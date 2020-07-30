import PublicLinkRevoke from '../../../src/components/public-link/revoke.vue';
import testData from '../../data';
import { load, mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';
import { trigger } from '../../util/event';

const mockHttpForComponent = () => mockHttp()
  .mount(PublicLinkRevoke, {
    propsData: { state: true, publicLink: testData.standardPublicLinks.last() }
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
    load('/projects/1/forms/f/public-links', { component: true }, {})
      .testModalToggles(
        PublicLinkRevoke,
        '.public-link-row .btn-danger',
        '.btn-link'
      ));

  it('sends the correct request', () =>
    mockHttpForComponent()
      .request(trigger.click('.btn-danger'))
      .beforeEachResponse((_, { method, url }) => {
        method.should.equal('DELETE');
        url.should.equal(`/v1/sessions/${'a'.repeat(64)}`);
      })
      .respondWithProblem());

  it('implements some standard button things', () =>
    mockHttpForComponent()
      .testStandardButton({
        button: '.btn-danger',
        disabled: ['.btn-link'],
        modal: true
      }));

  describe('after a successful response', () => {
    const revoke = (series) => series
      .request(async (app) => {
        await trigger.click(app, '.public-link-row .btn-danger');
        await trigger.click(app, '#public-link-revoke .btn-danger');
      })
      .respondWithData(() => {
        testData.standardPublicLinks.update(-1, { token: null });
        return { success: true };
      })
      .respondWithData(() => testData.standardPublicLinks.sorted());

    it('shows a success alert', () =>
      load('/projects/1/forms/f/public-links', { component: true }, {})
        .complete()
        .modify(revoke)
        .afterResponses(app => {
          app.should.alert('success', (message) => {
            message.should.containEql('My Public Link');
          });
        }));

    it('indicates that the public link has been revoked', () =>
      load('/projects/1/forms/f/public-links', { component: true }, {})
        .complete()
        .modify(revoke)
        .afterResponses(app => {
          const text = app.first('.public-link-row .access-link').text().trim();
          text.should.equal('Revoked');
        }));

    it('no longer highlights a new public link', () =>
      load('/projects/1/forms/f/public-links', { component: true }, {})
        .complete()
        .request(async (app) => {
          await trigger.click('.heading-with-button .btn-primary');
          await trigger.submit(app, '#public-link-create form', [
            ['input', 'Another Link']
          ]);
        })
        .respondWithData(() => testData.standardPublicLinks.createNew({
          displayName: 'Another Link'
        }))
        .respondWithData(() => testData.standardPublicLinks.sorted())
        .complete()
        .modify(revoke)
        .afterResponses(app => {
          app.find('.public-link-row.success').length.should.equal(0);
        }));
  });
});

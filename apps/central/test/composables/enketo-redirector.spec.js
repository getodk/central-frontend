import sinon from 'sinon';
import testData from '../data';
import { load } from '../util/http';
import { mergeMountOptions } from '../util/lifecycle';
import { mockLogin } from '../util/session';

const enketoId = 'sCTIfjC5LrUto4yVXRYJkNKzP7e53vo';

const mountOptions = (options) => mergeMountOptions(options, {
  global: {
    stubs: {
      WebFormRenderer: {
        template: '<div class="odk-form">dummy renderer</div>'
      }
    }
  }
});
describe('useEnketoRedirector', () => {
  beforeEach(() => {
    mockLogin();
  });

  describe('ensureCanonicalPath', () => {
    it('should redirect to new submission page', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a' });
      return load(`/f/${enketoId}/new`)
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/projects/1/forms/a/submissions/new');
        });
    });

    it('should pass query parameters as it is after redirection', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a' });
      return load(`/f/${enketoId}/new?d[firstname]=john%20doe`)
        .afterResponses(app => {
          const iframe = app.find('iframe');
          const src = iframe.attributes('src');
          src.should.contain('john%20doe');
        });
    });

    it('should redirect to new draft submission page', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a', publishedAt: null, draft: true });
      return load(`/f/${enketoId}/new`)
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/projects/1/forms/a/draft/submissions/new');
        });
    });

    it('should redirect to Form preview page', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a' });
      return load(`/f/${enketoId}/preview`)
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/projects/1/forms/a/preview');
        });
    });

    it('should redirect to draft Form preview page', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a', publishedAt: null, draft: true });
      return load(`/f/${enketoId}/preview`)
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/projects/1/forms/a/draft/preview');
        });
    });

    it('should redirect to new submission page when webforms is enabled - offline', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a', webformsEnabled: true });
      return load(`/f/${enketoId}/offline`, mountOptions())
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/projects/1/forms/a/submissions/new/offline');
        });
    });

    it('should redirect to new draft submission page when webforms is enabled - offline', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a', publishedAt: null, draft: true, webformsEnabled: true });
      return load(`/f/${enketoId}/offline`, mountOptions())
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/projects/1/forms/a/draft/submissions/new/offline');
        });
    });

    it('should preserve form data while redirecting', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a' });
      let formRequestCount = 0;
      return load(`/f/${enketoId}/new`)
        .beforeEachResponse((app, { url }) => {
          if (url.match(/form/)) formRequestCount += 1;
        })
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/projects/1/forms/a/submissions/new');
          formRequestCount.should.equal(1);
        });
    });

    it('should pass query parameter to the target', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a' });
      return load(`/f/${enketoId}/new?return_url=http%3A%2F%2Fexample.com&d[/data/first_name]=john`)
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/projects/1/forms/a/submissions/new');
          app.vm.$route.query.should.deep.equal({
            return_url: 'http://example.com',
            'd[/data/first_name]': 'john'
          });
        });
    });
  });

  describe('ensureEnketoOfflinePath', () => {
    it('should redirect to Enketo offline page from public link', () => {
      const fakeLocationReplace = sinon.fake();
      testData.extendedForms.createPast(1, { xmlFormId: 'a' });
      return load(`/f/${enketoId}/offline?st=123`, mountOptions({
        container: {
          location: {
            replace: (url) => {
              fakeLocationReplace(url);
            }
          }
        }
      }))
        .afterResponses(() => {
          fakeLocationReplace.calledWith(`/-/x/${enketoId}?st=123`).should.be.true;
        });
    });

    it('should redirect to Enketo offline page from canonical path', () => {
      const fakeLocationReplace = sinon.fake();
      testData.extendedForms.createPast(1, { xmlFormId: 'a' });
      return load('/projects/1/forms/a/submissions/new/offline', mountOptions({
        container: {
          location: {
            replace: (url) => {
              fakeLocationReplace(url);
            }
          }
        }
      }))
        .afterResponses(() => {
          fakeLocationReplace.calledWith('/-/x/xyz').should.be.true;
        });
    });

    it('should redirect to Enketo offline page from draft canonical path', () => {
      const fakeLocationReplace = sinon.fake();
      testData.extendedForms.createPast(1, { xmlFormId: 'a', publishedAt: null, draft: true });
      return load('/projects/1/forms/a/draft/submissions/new/offline', mountOptions({
        container: {
          location: {
            replace: (url) => {
              fakeLocationReplace(url);
            }
          }
        }
      }))
        .afterResponses(() => {
          fakeLocationReplace.calledWith('/-/x/xyz').should.be.true;
        });
    });
  });
});

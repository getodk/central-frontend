import testData from '../data';
import { load } from '../util/http';
import { mockLogin } from '../util/session';

const enketoId = 'sCTIfjC5LrUto4yVXRYJkNKzP7e53vo';

describe('EnketoRedirector', () => {
  beforeEach(() => {
    mockLogin();
  });

  it('should redirect to new submission page', () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a' });
    return load(`/f/${enketoId}/new`)
      .respondWithData(() => testData.extendedProjects.last())
      .afterResponses(app => {
        app.vm.$route.path.should.equal('/projects/1/forms/a/submissions/new');
      });
  });

  it('should redirect to new draft submission page', () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a', publishedAt: null, draft: true });
    return load(`/f/${enketoId}/new`)
      .respondWithData(() => testData.extendedProjects.last())
      .afterResponses(app => {
        app.vm.$route.path.should.equal('/projects/1/forms/a/draft/submissions/new');
      });
  });

  it('should redirect to edit submission page', () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a' });
    return load(`/f/${enketoId}/edit?instance_id=123`)
      .respondWithData(() => testData.extendedProjects.last())
      .afterResponses(app => {
        app.vm.$route.path.should.equal('/projects/1/forms/a/submissions/123/edit');
      });
  });

  it('should redirect to edit submission page', () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a' });
    return load(`/f/${enketoId}/edit`)
      .afterResponses(app => {
        app.vm.$route.path.should.equal('/projects/1/forms/a/submissions//edit');
        app.find('.panel-title').text().should.equal('Page Not Found');
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

  it('should preserve form data while redirecting', () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a' });
    let formRequestCount = 0;
    return load(`/f/${enketoId}/new`)
      .respondWithData(() => testData.extendedProjects.last())
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
      .respondWithData(() => testData.extendedProjects.last())
      .afterResponses(app => {
        app.vm.$route.path.should.equal('/projects/1/forms/a/submissions/new');
        app.vm.$route.query.should.deep.equal({
          return_url: 'http://example.com',
          'd[/data/first_name]': 'john'
        });
      });
  });
});

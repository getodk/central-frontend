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
      .respondFor('/projects/1/forms/a/submissions/new')
      .afterResponses(app => {
        app.vm.$route.path.should.equal('/projects/1/forms/a/submissions/new');
      });
  });

  it('should redirect to new draft submission page', () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a', publishedAt: null, draft: true });
    return load(`/f/${enketoId}/new`)
      .respondFor('/projects/1/forms/a/draft/submissions/new')
      .afterResponses(app => {
        app.vm.$route.path.should.equal('/projects/1/forms/a/draft/submissions/new');
      });
  });

  it('should redirect to edit submission page', () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a' });
    return load(`/f/${enketoId}/edit?instance_id=123`)
      .respondFor('/projects/1/forms/a/submissions/123/edit')
      .afterResponses(app => {
        app.vm.$route.path.should.equal('/projects/1/forms/a/submissions/123/edit');
      });
  });

  it('should redirect to Form preview page', () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a' });
    return load(`/f/${enketoId}/preview`)
      .respondFor('/projects/1/forms/a/preview')
      .afterResponses(app => {
        app.vm.$route.path.should.equal('/projects/1/forms/a/preview');
      });
  });

  it('should redirect to draft Form preview page', () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a', publishedAt: null, draft: true });
    return load(`/f/${enketoId}/preview`)
      .respondFor('/projects/1/forms/a/draft/preview')
      .afterResponses(app => {
        app.vm.$route.path.should.equal('/projects/1/forms/a/draft/preview');
      });
  });

  it('should redirect to new submission page - offline', () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a' });
    return load(`/f/${enketoId}/offline`)
      .respondFor('/projects/1/forms/a/submissions/new/offline')
      .afterResponses(app => {
        app.vm.$route.path.should.equal('/projects/1/forms/a/submissions/new/offline');
      });
  });

  it('should redirect to new draft submission page - offline', () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a', publishedAt: null, draft: true });
    return load(`/f/${enketoId}/offline`)
      .respondFor('/projects/1/forms/a/draft/submissions/new/offline')
      .afterResponses(app => {
        app.vm.$route.path.should.equal('/projects/1/forms/a/draft/submissions/new/offline');
      });
  });

  it('should preserve form data while redirecting', () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a' });
    let formRequestCount = 0;
    return load(`/f/${enketoId}/new`)
      .respondFor('/projects/1/forms/a/submissions/new')
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
      .respondFor('/projects/1/forms/a/submissions/new')
      .afterResponses(app => {
        app.vm.$route.path.should.equal('/projects/1/forms/a/submissions/new');
        app.vm.$route.query.should.deep.equal({
          return_url: 'http://example.com',
          'd[/data/first_name]': 'john'
        });
      });
  });
});

const { default: testData } = require('../data');
const { load } = require('../util/http');
const { mockLogin } = require('../util/session');

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

  it('should redirect to edit submission page', () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a' });
    return load(`/f/${enketoId}/edit?instance_id=123`)
      .respondFor('/projects/1/forms/a/submissions/123/edit')
      .afterResponses(app => {
        app.vm.$route.path.should.equal('/projects/1/forms/a/submissions/123/edit');
      });
  });
});

import testData from '../../../data';
import { load } from '../../../util/http';
import { mockLogin } from '../../../util/session';

describe('FormEditCreateDraft', () => {
  beforeEach(mockLogin);

  it('sends the correct request', () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a b' });
    return load('/projects/1/forms/a%20b/draft')
      .complete()
      .request(app =>
        app.get('#form-edit-create-draft-button').trigger('click'))
      .respondWithProblem()
      .testRequests([{
        method: 'POST',
        url: '/v1/projects/1/forms/a%20b/draft'
      }]);
  });

  it('implements standard button things', () => {
    testData.extendedForms.createPast(1);
    return load('/projects/1/forms/f/draft')
      .complete()
      .testStandardButton({ button: '#form-edit-create-draft-button' });
  });

  describe('after a successful response', () => {
    const create = () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a b' });
      return load('/projects/1/forms/a%20b/draft')
        .complete()
        .request(app =>
          app.get('#form-edit-create-draft-button').trigger('click'))
        .respondWithData(() => {
          testData.extendedFormVersions.createNew({ draft: true });
          return { success: true };
        })
        .respondWithData(() => testData.extendedFormDrafts.last())
        .respondWithData(() => testData.standardFormAttachments.sorted())
        .respondForComponent('FormEdit');
    };

    it('sends the correct requests', () =>
      create().testRequests([
        null,
        { url: '/v1/projects/1/forms/a%20b/draft', extended: true },
        { url: '/v1/projects/1/forms/a%20b/draft/attachments' },
        { url: '/v1/projects/1/forms/a%20b/versions', extended: true },
        { url: '/v1/projects/1/forms/a%20b/draft/submissions/keys' },
        { url: '/v1/projects/1/forms/a%20b/draft/fields?odata=true' },
        {
          url: ({ pathname }) => { pathname.should.include('.svc'); }
        }
      ]));
  });
});

import Property from '../../util/ds-property-enum';
import testData from '../../data';
import { dragAndDrop } from '../../util/trigger';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('FormEdit', () => {
  beforeEach(mockLogin);

  describe('initial requests', () => {
    it('sends the correct requests if there is no form draft', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a b' });
      return load('/projects/1/forms/a%20b/draft', { root: false })
        .testRequests([
          { url: '/v1/projects/1/forms/a%20b/draft', extended: true }
        ]);
    });

    it('sends the correct requests if there is an existing form draft', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a b' });
      testData.extendedFormVersions.createPast(1, { draft: true });
      return load('/projects/1/forms/a%20b/draft', { root: false })
        .testRequests([
          { url: '/v1/projects/1/forms/a%20b/draft', extended: true },
          { url: '/v1/projects/1/forms/a%20b/draft/attachments' },
          { url: '/v1/projects/1/forms/a%20b/versions', extended: true },
          { url: '/v1/projects/1/forms/a%20b/draft/submissions/keys' },
          { url: '/v1/projects/1/forms/a%20b/draft/fields?odata=true' },
          {
            url: ({ pathname }) => {
              pathname.should.equal('/v1/projects/1/forms/a%20b/draft.svc/Submissions');
            }
          }
        ]);
    });

    it('requests the dataset diff if the form draft is entityRelated', () => {
      testData.extendedForms.createPast(1, { draft: true, entityRelated: true });
      testData.formDraftDatasetDiffs.createPast(1, {
        isNew: true,
        properties: [Property.NewProperty]
      });
      return load('/projects/1/forms/f/draft').testRequestsInclude([{
        url: '/v1/projects/1/forms/f/draft/dataset-diff'
      }]);
    });
  });

  it('does not error for file drop after attachments section is removed', () => {
    testData.extendedForms.createPast(1, { draft: true });
    testData.standardFormAttachments.createPast(1, { name: 'foo' });
    return load('/projects/1/forms/f/draft')
      .afterResponses(app => {
        app.find('#form-edit-attachments').exists().should.be.true;
      })
      .request(async (app) => {
        await app.get('#form-edit-publish-button').trigger('click');
        return app.get('#form-draft-publish .btn-primary').trigger('click');
      })
      .respondWithData(() => {
        testData.extendedFormDrafts.publish(-1);
        return { success: true };
      })
      .respondWithData(() => testData.extendedProjects.last())
      .respondWithData(() => testData.extendedForms.last())
      .respondWithData(() => testData.standardFormAttachments.sorted()) // publishedAttachments
      .respondWithData(() => testData.formDatasetDiffs.sorted())
      .afterResponses(async (app) => {
        app.find('#form-edit-attachments').exists().should.be.false;
        // As long as this doesn't result in an error, we're in the clear.
        await dragAndDrop(app.get('#form-edit'), [new File([''], 'foo')]);
      });
  });
});

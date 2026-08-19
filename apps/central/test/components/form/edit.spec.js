import Property from '../../util/ds-property-enum';
import testData from '../../data';
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
});

import Property from '../../../util/ds-property-enum';
import testData from '../../../data';
import { load } from '../../../util/http';
import { mockLogin } from '../../../util/session';

describe('FormEditEntities', () => {
  beforeEach(mockLogin);

  it('renders correctly if the form draft is entityRelated', async () => {
    testData.extendedForms.createPast(1, { draft: true, entityRelated: true });
    testData.formDraftDatasetDiffs.createPast(1, { isNew: false });
    const app = await load('/projects/1/forms/f/draft');
    const subtitle = app.get('#form-edit-entities .form-edit-section-subtitle').text();
    subtitle.should.endWith('will update 1 Entity List.');
    app.find('#form-edit-entities .dataset-summary-row').exists().should.be.true;
  });

  it('renders correctly if the form draft is not entityRelated', async () => {
    testData.extendedForms.createPast(1, { draft: true });
    const app = await load('/projects/1/forms/f/draft');
    const p = app.get('#form-edit-entities .form-edit-section-body p');
    p.text().should.startWith('This definition does not update any Entities.');
    app.get('#form-edit-entities .form-edit-section-subtitle').text().should.equal('');
    app.get('#form-edit-entities .form-edit-section-tag').text().should.equal('');
    app.find('#form-edit-entities .dataset-summary-row').exists().should.be.false;
  });

  describe('diff counts', () => {
    beforeEach(() => {
      testData.extendedForms.createPast(1, { draft: true, entityRelated: true });
    });

    it('is not shown if there are no new entity lists or properties', async () => {
      testData.formDraftDatasetDiffs.createPast(1, {
        isNew: false,
        properties: [Property.InFormProperty]
      });
      const app = await load('/projects/1/forms/f/draft');
      app.find('#form-edit-entities-diff-counts').exists().should.be.false;
    });

    it('shows correct text for a new entity list without properties', async () => {
      testData.formDraftDatasetDiffs.createPast(1, { isNew: true });
      const app = await load('/projects/1/forms/f/draft');
      const text = app.get('#form-edit-entities-diff-counts').text();
      text.should.endWith('will update 1 Entity List.');
    });
  });
});

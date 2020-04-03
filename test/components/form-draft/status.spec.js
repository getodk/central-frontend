import FormVersionSummaryItem from '../../../src/components/form-version/summary-item.vue';
import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('FormDraftStatus', () => {
  beforeEach(mockLogin);

  it('renders FormVersionSummaryItem for the draft', () => {
    testData.extendedForms.createPast(1);
    testData.extendedFormVersions.createPast(1, { version: 'v2', draft: true });
    return load('/projects/1/forms/f/draft').then(app => {
      const component = app.first(FormVersionSummaryItem);
      component.getProp('version').version.should.equal('v2');
    });
  });
});

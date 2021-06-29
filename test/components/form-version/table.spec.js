import FormVersionRow from '../../../src/components/form-version/row.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('FormVersionTable', () => {
  beforeEach(mockLogin);

  it('renders the correct number of rows', async () => {
    testData.extendedForms.createPast(1);
    testData.extendedFormVersions.createPast(1, { version: 'v2' });
    const component = await load('/projects/1/forms/f/versions', { root: false });
    component.findAllComponents(FormVersionRow).length.should.equal(2);
  });
});

import FormEditSection from '../../../../src/components/form/edit/section.vue';

import testData from '../../../data';
import { load } from '../../../util/http';
import { mockLogin } from '../../../util/session';

describe('FormDefAttachments', () => {
  beforeEach(mockLogin);

  describe('subtitle', () => {
    it('shows the correct text if there are no attachments', async () => {
      testData.extendedForms.createPast(1, { draft: true });
      const app = await load('/projects/1/forms/f/draft');
      const subtitle = app.get('#form-edit-attachments .form-edit-section-subtitle').text();
      subtitle.should.startWith('This definition requires no attachments,');
    });

    it('shows the correct text if there is a missing attachment', async () => {
      testData.extendedForms.createPast(1, { draft: true });
      testData.standardFormAttachments
        .createPast(1, { blobExists: true })
        .createPast(1, { datasetExists: true })
        .createPast(1, { blobExists: false, datasetExists: false });
      const app = await load('/projects/1/forms/f/draft');
      const subtitle = app.get('#form-edit-attachments .form-edit-section-subtitle').text();
      subtitle.should.equal('1 missing attachment');
    });

    it('shows the correct text if all attachments have been uploaded', async () => {
      testData.extendedForms.createPast(1, { draft: true });
      testData.standardFormAttachments.createPast(2);
      const app = await load('/projects/1/forms/f/draft');
      const subtitle = app.get('#form-edit-attachments .form-edit-section-subtitle').text();
      subtitle.should.equal('2 attachments');
    });
  });

  it('shows a warning if there is a missing attachment', async () => {
    testData.extendedForms.createPast(1, { draft: true });
    testData.standardFormAttachments.createPast(1, { blobExists: false });
    const app = await load('/projects/1/forms/f/draft');
    const section = app.get('#form-edit-attachments').getComponent(FormEditSection);
    section.props().warning.should.be.true;
  });
});

import ChecklistStep from '../../../src/components/checklist-step.vue';
import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('FormDraftChecklist', () => {
  beforeEach(mockLogin);

  describe('Upload initial Form definition', () => {
    it('is shown for a form without a published version', () => {
      testData.extendedForms.createPast(1, { draft: true });
      testData.standardFormAttachments.createPast(1);
      return load('/projects/1/forms/f/draft').then(app => {
        app.find(ChecklistStep).length.should.equal(5);
      });
    });

    it('is not shown for a form with a published version', () => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, { draft: true });
      testData.standardFormAttachments.createPast(1);
      return load('/projects/1/forms/f/draft').then(app => {
        app.find(ChecklistStep).length.should.equal(4);
      });
    });

    it('is not shown in the form overview', () => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, { draft: true });
      testData.standardFormAttachments.createPast(1);
      return load('/projects/1/forms/f').then(app => {
        app.find('#form-overview-draft .checklist-step').length.should.equal(4);
      });
    });

    it('is marked as complete', () => {
      testData.extendedForms.createPast(1, { draft: true });
      testData.standardFormAttachments.createPast(1);
      return load('/projects/1/forms/f/draft').then(app => {
        app.first(ChecklistStep).getProp('stage').should.equal('complete');
      });
    });
  });

  describe('Upload revised Form definition', () => {
    beforeEach(() => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, { draft: true });
    });

    it('is marked as a current step', () =>
      load('/projects/1/forms/f/draft').then(app => {
        app.first(ChecklistStep).getProp('stage').should.equal('current');
      }));

    it('links to .../draft from the form overview', () =>
      load('/projects/1/forms/f').then(app => {
        const a = app.first('#form-overview-draft .checklist-step a');
        a.getAttribute('href').should.equal('#/projects/1/forms/f/draft');
      }));

    it('does not link to .../draft from .../draft', () =>
      load('/projects/1/forms/f/draft').then(app => {
        app.first(ChecklistStep).find('a').length.should.equal(0);
      }));
  });

  describe('Upload Form Media Files', () => {
    beforeEach(() => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, { draft: true });
    });

    it('is shown if the draft has an attachment', () => {
      testData.standardFormAttachments.createPast(1);
      return load('/projects/1/forms/f/draft').then(app => {
        app.find(ChecklistStep).length.should.equal(4);
      });
    });

    it('is not shown if the form draft does not have an attachment', () =>
      load('/projects/1/forms/f/draft').then(app => {
        app.find(ChecklistStep).length.should.equal(3);
      }));

    it('is marked as complete if all attachments exist', () => {
      testData.standardFormAttachments.createPast(1, { exists: true });
      return load('/projects/1/forms/f/draft').then(app => {
        app.find(ChecklistStep)[1].getProp('stage').should.equal('complete');
      });
    });

    it('is marked as a current step if an attachment is missing', () => {
      testData.standardFormAttachments
        .createPast(1, { exists: true })
        .createPast(1, { exists: false });
      return load('/projects/1/forms/f/draft').then(app => {
        app.find(ChecklistStep)[1].getProp('stage').should.equal('current');
      });
    });
  });

  describe('Test the Form on your mobile device', () => {
    it('is marked as complete if the draft has a submission', () => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, {
        draft: true,
        submissions: 1
      });
      testData.standardFormAttachments.createPast(1);
      return load('/projects/1/forms/f/draft').then(app => {
        app.find(ChecklistStep)[2].getProp('stage').should.equal('complete');
      });
    });

    it('is marked as a current step if draft does not have a submission', () => {
      testData.extendedForms.createPast(1, { submissions: 1 });
      testData.extendedFormVersions.createPast(1, { draft: true });
      testData.standardFormAttachments.createPast(1);
      return load('/projects/1/forms/f/draft').then(app => {
        app.find(ChecklistStep)[2].getProp('stage').should.equal('current');
      });
    });
  });

  describe('Publish the Draft', () => {
    beforeEach(() => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, { draft: true });
      testData.standardFormAttachments.createPast(1);
    });

    it('is marked as a current step', () =>
      load('/projects/1/forms/f/draft').then(app => {
        app.find(ChecklistStep)[3].getProp('stage').should.equal('current');
      }));

    it('links to .../draft from the form overview', () =>
      load('/projects/1/forms/f').then(app => {
        const a = app.find('#form-overview-draft .checklist-step')[3].find('a');
        a.length.should.equal(2);
        a[0].getAttribute('href').should.equal('#/projects/1/forms/f/draft');
      }));

    it('does not link to .../draft from .../draft', () =>
      load('/projects/1/forms/f/draft').then(app => {
        app.find(ChecklistStep)[3].find('a').length.should.equal(1);
      }));
  });
});

import testData from '../../../data';
import { load } from '../../../util/http';
import { mockLogin } from '../../../util/session';

describe('FormEditWebForm', () => {
  beforeEach(mockLogin);

  describe('initial render', () => {
    it('does not render the component when published', async () => {
      testData.extendedForms.createPast(1, { draft: false, webformsEnabled: true });
      const app = await load('/projects/1/forms/f/draft');
      app.find('#form-edit-web-form').exists().should.be.false;
    });

    it('renders the component when not yet published', async () => {
      testData.extendedForms.createPast(1, { draft: true, webformsEnabled: true });
      const app = await load('/projects/1/forms/f/draft');
      app.find('#form-edit-web-form').exists().should.be.true;
    });

    it('selects "New ODK Web Forms" option when webformsEnabled is true', async () => {
      testData.extendedForms.createPast(1, { draft: true, webformsEnabled: true });
      const app = await load('/projects/1/forms/f/draft');
      const radios = app.findAll('#form-edit-web-form input[type="radio"]');
      radios[0].element.checked.should.be.true;
      radios[1].element.checked.should.be.false;
    });

    it('selects "Enketo compatibility mode" option when webformsEnabled is false', async () => {
      testData.extendedForms.createPast(1, { draft: true, webformsEnabled: false });
      const app = await load('/projects/1/forms/f/draft');
      const radios = app.findAll('#form-edit-web-form input[type="radio"]');
      radios[0].element.checked.should.be.false;
      radios[1].element.checked.should.be.true;
    });
  });

  describe('PATCH request on selection change', () => {
    it('sends correct PATCH request when selecting Enketo mode', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a', draft: true, webformsEnabled: true });
      return load('/projects/1/forms/a/draft')
        .complete()
        .request(app => {
          const enketoRadio = app.findAll('#form-edit-web-form input[type="radio"]')[1];
          return enketoRadio.setValue(true);
        })
        .respondWithData(() => {
          testData.extendedFormDrafts.update(-1, { webformsEnabled: false });
          return testData.standardFormDrafts.last();
        })
        .testRequests([{
          method: 'PATCH',
          url: '/v1/projects/1/forms/a',
          data: { webformsEnabled: false }
        }]);
    });

    it('sends correct PATCH request when selecting Web Forms mode', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a', draft: true, webformsEnabled: false });
      return load('/projects/1/forms/a/draft')
        .complete()
        .request(app => {
          const webFormsRadio = app.findAll('#form-edit-web-form input[type="radio"]')[0];
          return webFormsRadio.setValue(true);
        })
        .respondWithData(() => {
          testData.extendedFormDrafts.update(-1, { webformsEnabled: true });
          return testData.standardFormDrafts.last();
        })
        .testRequests([{
          method: 'PATCH',
          url: '/v1/projects/1/forms/a',
          data: { webformsEnabled: true }
        }]);
    });

    it('disables radio field while request is in progress', () => {
      testData.extendedForms.createPast(1, { draft: true, webformsEnabled: true });
      return load('/projects/1/forms/f/draft')
        .complete()
        .request(app => {
          const enketoRadio = app.findAll('#form-edit-web-form input[type="radio"]')[1];
          return enketoRadio.setValue(true);
        })
        .beforeAnyResponse(app => {
          const radios = app.findAll('#form-edit-web-form input[type="radio"]');
          radios[0].element.disabled.should.be.true;
          radios[1].element.disabled.should.be.true;
        })
        .respondWithData(() => {
          testData.extendedFormDrafts.update(-1, { webformsEnabled: false });
          return testData.standardFormDrafts.last();
        })
        .afterResponse(app => {
          const radios = app.findAll('#form-edit-web-form input[type="radio"]');
          radios[0].element.disabled.should.be.false;
          radios[1].element.disabled.should.be.false;
        });
    });

    it('reverts selection when PATCH request fails', () => {
      testData.extendedForms.createPast(1, { draft: true, webformsEnabled: true });
      return load('/projects/1/forms/f/draft')
        .complete()
        .request(app => {
          const enketoRadio = app.findAll('#form-edit-web-form input[type="radio"]')[1];
          return enketoRadio.setValue(true);
        })
        .respondWithProblem()
        .afterResponse(app => {
          const radios = app.findAll('#form-edit-web-form input[type="radio"]');
          // Should revert back to original value (webformsEnabled: true)
          radios[0].element.checked.should.be.true;
          radios[1].element.checked.should.be.false;
        });
    });
  });
});

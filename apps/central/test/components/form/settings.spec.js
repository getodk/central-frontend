import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('FormSettings', () => {
  beforeEach(mockLogin);

  describe('autosave', () => {
    describe('initial render', () => {
      it('selects autosave option when autosaveEnabled is true', async () => {
        testData.extendedForms.createPast(1, { webformsEnabled: true, autosaveEnabled: true });
        const app = await load('/projects/1/forms/f/settings');
        const checkbox = app.find('#web-form-settings-form input[name="autosaveEnabled"]');
        checkbox.element.checked.should.be.true;
      });

      it('deselects autosave option when autosaveEnabled is false', async () => {
        testData.extendedForms.createPast(1, { webformsEnabled: true, autosaveEnabled: false });
        const app = await load('/projects/1/forms/f/settings');
        const checkbox = app.find('#web-form-settings-form input[name="autosaveEnabled"]');
        checkbox.element.checked.should.be.false;
      });

      it('disables autosave option when webformsEnabled is false', async () => {
        testData.extendedForms.createPast(1, { webformsEnabled: false, autosaveEnabled: true });
        const app = await load('/projects/1/forms/f/settings');
        const checkbox = app.find('#web-form-settings-form input[name="autosaveEnabled"]');
        checkbox.element.checked.should.be.true;
        checkbox.element.disabled.should.be.true;
      });
    });

    describe('PATCH request on selection change', () => {
      it('sends correct PATCH request when selecting autosave enabled', () => {
        testData.extendedForms.createPast(1, { webformsEnabled: true, autosaveEnabled: false });
        return load('/projects/1/forms/f/settings')
          .complete()
          .request(app => {
            const checkbox = app.find('#web-form-settings-form input[name="autosaveEnabled"]');
            return checkbox.setValue(true);
          })
          .respondWithData(() => {
            testData.extendedForms.update(-1, { autosaveEnabled: true });
            return testData.extendedForms.last();
          })
          .testRequests([{
            method: 'PATCH',
            url: '/v1/projects/1/forms/f',
            data: { autosaveEnabled: true }
          }])
          .then(app => {
            app.should.toast('Autosave is now enabled for your “f” form.');
          });
      });
    });
  });

  describe('forms engine', () => {
    describe('initial render', () => {
      it('selects webforms option when webformsEnabled is true', async () => {
        testData.extendedForms.createPast(1, { webformsEnabled: true });
        const app = await load('/projects/1/forms/f/settings');
        const radios = app.findAll('#web-form-settings-form input[name="webformsEnabled"]');
        radios[0].element.checked.should.be.true;
        radios[1].element.checked.should.be.false;
      });

      it('deselects webforms option when webformsEnabled is false', async () => {
        testData.extendedForms.createPast(1, { webformsEnabled: false });
        const app = await load('/projects/1/forms/f/settings');
        const radios = app.findAll('#web-form-settings-form input[name="webformsEnabled"]');
        radios[0].element.checked.should.be.false;
        radios[1].element.checked.should.be.true;
      });
    });

    describe('PATCH request on selection change', () => {
      it('sends correct PATCH request when selecting webforms enabled', () => {
        testData.extendedForms.createPast(1, { webformsEnabled: false });
        return load('/projects/1/forms/f/settings')
          .complete()
          .request(async app => {
            const webFormsRadio = app.findAll('#web-form-settings-form input[name="webformsEnabled"]')[0];
            await webFormsRadio.setValue(true);
            return app.get('#form-engine-change-confirmation .btn-primary').trigger('click');
          })
          .respondWithData(() => {
            testData.extendedForms.update(-1, { webformsEnabled: true });
            return testData.extendedForms.last();
          })
          .testRequests([{
            method: 'PATCH',
            url: '/v1/projects/1/forms/f',
            data: { webformsEnabled: true }
          }])
          .then(app => {
            app.should.toast('You’re now using ODK Web Forms to fill out, preview and edit your “f” form.');
          });
      });

      it('sends correct PATCH request when selecting enketo enabled', () => {
        testData.extendedForms.createPast(1, { webformsEnabled: true });
        return load('/projects/1/forms/f/settings')
          .complete()
          .request(async app => {
            const enketoRadio = app.findAll('#web-form-settings-form input[name="webformsEnabled"]')[1];
            await enketoRadio.setValue(true);
            return app.get('#form-engine-change-confirmation .btn-primary').trigger('click');
          })
          .respondWithData(() => {
            testData.extendedForms.update(-1, { webformsEnabled: false });
            return testData.extendedForms.last();
          })
          .testRequests([{
            method: 'PATCH',
            url: '/v1/projects/1/forms/f',
            data: { webformsEnabled: false }
          }])
          .then(app => {
            app.should.toast('You’re now using Enketo to fill out, preview and edit your “f” form.');
          });
      });
    });
  });
});

import ChecklistStep from '../../../src/components/checklist-step.vue';
import FormNew from '../../../src/components/form/new.vue';
import FormRow from '../../../src/components/form/row.vue';
import FormVersionString from '../../../src/components/form-version/string.vue';

import testData from '../../data';
import { dragAndDrop, fileDataTransfer, setFiles } from '../../util/file';
import { load, mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';
import { mount } from '../../util/lifecycle';

const mountOptions = () => {
  const requestData = { project: testData.extendedProjects.last() };
  if (testData.extendedForms.size !== 0 &&
    testData.extendedFormVersions.last().publishedAt == null) {
    requestData.formDraft = testData.extendedFormDrafts.last();
  }
  return {
    props: { state: true },
    container: {
      router: mockRouter(requestData.formDraft == null
        ? '/projects/1'
        : '/projects/1/forms/f/draft'),
      requestData
    }
  };
};
const xlsForm = () => new File([''], 'my_form.xlsx', {
  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
});
const upload = async (component, file = xlsForm()) => {
  await setFiles(component.get('#form-new input'), [file]);
  return component.get('#form-new-upload-button').trigger('click');
};

describe('FormNew', () => {
  describe('new form modal', () => {
    beforeEach(() => {
      mockLogin();
      testData.extendedProjects.createPast(1);
    });

    it('toggles the modal', () =>
      load('/projects/1').testModalToggles({
        modal: FormNew,
        show: '#form-list-create-button',
        hide: '.btn-link'
      }));

    it('shows the correct modal title', () => {
      const text = mount(FormNew, mountOptions()).get('.modal-title').text();
      text.should.equal('Create Form');
    });

    describe('.modal-introduction', () => {
      it('shows the correct text for the first paragraph', () => {
        const modal = mount(FormNew, mountOptions());
        const text = modal.get('.modal-introduction p').text();
        text.should.startWith('To create a Form,');
      });

      it('renders the paragraph about form attachments', () => {
        const modal = mount(FormNew, mountOptions());
        const text = modal.findAll('.modal-introduction p')[1].text();
        text.should.containEql('Form Attachments');
      });
    });
  });

  describe('modal for uploading a new definition', () => {
    beforeEach(() => {
      mockLogin();
      testData.extendedForms.createPast(1, { draft: true });
    });

    it('toggles the modal', () =>
      load('/projects/1/forms/f/draft', { root: false }).testModalToggles({
        modal: FormNew,
        show: '#form-draft-status-upload-button',
        hide: '.btn-link'
      }));

    it('shows the correct modal title', () => {
      const text = mount(FormNew, mountOptions()).get('.modal-title').text();
      text.should.equal('Upload New Form Definition');
    });

    describe('.modal-introduction', () => {
      it('shows the correct text', () => {
        const modal = mount(FormNew, mountOptions());
        const text = modal.get('.modal-introduction p').text();
        text.should.startWith('To update the Draft,');
      });

      it('does not render the paragraph about form attachments', () => {
        const modal = mount(FormNew, mountOptions());
        modal.findAll('.modal-introduction p').length.should.equal(1);
      });
    });
  });

  describe('file selection', () => {
    beforeEach(() => {
      mockLogin();
      testData.extendedProjects.createPast(1);
    });

    it('shows an info alert if no file is selected', async () => {
      const modal = mount(FormNew, mountOptions());
      await modal.get('#form-new-upload-button').trigger('click');
      modal.should.alert('info');
    });

    it('hides the alert after a file is selected', async () => {
      const modal = mount(FormNew, mountOptions());
      await modal.get('#form-new-upload-button').trigger('click');
      await setFiles(modal.get('input'), [xlsForm()]);
      modal.should.not.alert();
    });

    describe('after the file is selected using the file input', () => {
      it('sets the file data property', async () => {
        const modal = mount(FormNew, mountOptions());
        await setFiles(modal.get('input'), [xlsForm()]);
        modal.vm.file.name.should.equal('my_form.xlsx');
      });

      it('resets the input', async () => {
        const modal = mount(FormNew, mountOptions());
        await setFiles(modal.get('input'), [xlsForm()]);
        modal.get('input').element.value.should.equal('');
      });
    });

    describe('drag and drop', () => {
      it('adds a class to drop zone while file is dragged', async () => {
        const modal = mount(FormNew, mountOptions());
        const dropZone = modal.get('#form-new-drop-zone');
        await dropZone.trigger('dragenter', {
          dataTransfer: fileDataTransfer([xlsForm()])
        });
        dropZone.classes('form-new-dragover').should.be.true();
      });

      it('sets the file data property after the file is dropped', async () => {
        const modal = mount(FormNew, mountOptions());
        await dragAndDrop(modal.get('#form-new-drop-zone'), [xlsForm()]);
        modal.vm.file.name.should.equal('my_form.xlsx');
      });
    });
  });

  describe('request URL', () => {
    beforeEach(mockLogin);

    it('sends a request to .../forms when creating a form', () => {
      testData.extendedProjects.createPast(1);
      return mockHttp()
        .mount(FormNew, mountOptions())
        .request(upload)
        .beforeEachResponse((_, { url }) => {
          url.should.equal('/v1/projects/1/forms');
        })
        .respondWithProblem();
    });

    it('sends a request to .../draft when uploading a new definition', () => {
      testData.extendedForms.createPast(1, { draft: true });
      return mockHttp()
        .mount(FormNew, mountOptions())
        .request(upload)
        .beforeEachResponse((_, { url }) => {
          url.should.equal('/v1/projects/1/forms/f/draft');
        })
        .respondWithProblem();
    });
  });

  describe('request headers', () => {
    beforeEach(() => {
      mockLogin();
      testData.extendedProjects.createPast(1);
    });

    it('sends the correct Content-Type header for an XML file', () =>
      mockHttp()
        .mount(FormNew, mountOptions())
        .request(modal => upload(modal, new File([''], 'my_form.xml')))
        .beforeEachResponse((_, { headers }) => {
          headers['Content-Type'].should.equal('application/xml');
        })
        .respondWithProblem());

    it('sends the correct headers for an .xlsx file', () =>
      mockHttp()
        .mount(FormNew, mountOptions())
        .request(modal => upload(modal, new File([''], 'formulář.xlsx', {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })))
        .beforeEachResponse((_, { headers }) => {
          headers['Content-Type'].should.equal('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          headers['X-XlsForm-FormId-Fallback'].should.equal('formul%C3%A1%C5%99');
        })
        .respondWithProblem());

    it('sends the correct headers for an .xls file', () =>
      mockHttp()
        .mount(FormNew, mountOptions())
        .request(modal => upload(modal, new File([''], 'formulář.xls', {
          type: 'application/vnd.ms-excel'
        })))
        .beforeEachResponse((_, { headers }) => {
          headers['Content-Type'].should.equal('application/vnd.ms-excel');
          headers['X-XlsForm-FormId-Fallback'].should.equal('formul%C3%A1%C5%99');
        })
        .respondWithProblem());

    it('determines the content type based on the file extension', () =>
      mockHttp()
        .mount(FormNew, mountOptions())
        .request(modal => upload(modal, new File([''], 'my_form.xlsx', {
          type: 'application/xml'
        })))
        .beforeEachResponse((_, { headers }) => {
          headers['Content-Type'].should.equal('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        })
        .respondWithProblem());
  });

  it('implements some standard button things for the upload button', () => {
    mockLogin();
    testData.extendedProjects.createPast(1);
    return mockHttp()
      .mount(FormNew, mountOptions())
      .testStandardButton({
        button: '#form-new-upload-button',
        request: upload,
        disabled: ['.modal-warnings .btn-primary', '.btn-link'],
        modal: true
      });
  });

  it('disables the drop zone while the request is in progress', () => {
    mockLogin();
    testData.extendedProjects.createPast(1);
    return mockHttp()
      .mount(FormNew, mountOptions())
      .request(upload)
      .beforeEachResponse(modal => {
        modal.vm.disabled.should.be.true();
        const dropZone = modal.get('#form-new-drop-zone');
        dropZone.classes('form-new-disabled').should.be.true();
        const button = dropZone.get('.btn-primary');
        button.element.disabled.should.be.true();
      })
      .respondWithProblem();
  });

  describe('after creating a form', () => {
    const createForm = () => {
      mockLogin();
      testData.extendedForms.createPast(1, { xmlFormId: 'f1', name: 'Form 1' });
      return load('/projects/1')
        .afterResponses(app =>
          app.get('#form-list-create-button').trigger('click'))
        .request(upload)
        .respondWithData(() =>
          testData.standardForms.createNew({ xmlFormId: 'f2', name: 'Form 2' }))
        .respondFor('/projects/1/forms/f2/draft', { project: false });
    };

    it('redirects to .../draft', () =>
      createForm().then(app => {
        app.vm.$route.path.should.equal('/projects/1/forms/f2/draft');
      }));

    it('shows the form name', () =>
      createForm().then(app => {
        app.get('#form-head-form-nav .h1').text().should.equal('Form 2');
      }));

    it('shows a success alert', () =>
      createForm().then(app => {
        app.should.alert('success', 'Your new Form “Form 2” has been created as a Draft. Take a look at the checklist below, and when you feel it’s ready, you can publish the Form for use.');
      }));

    it('renders the correct number of rows in the forms table', () =>
      createForm()
        .complete()
        .load('/projects/1', { project: false })
        .afterResponses(app => {
          app.findAllComponents(FormRow).length.should.equal(2);
        }));
  });

  describe('after uploading a new definition', () => {
    beforeEach(mockLogin);

    it('hides the modal', () => {
      testData.extendedForms.createPast(1, { draft: true });
      return load('/projects/1/forms/f/draft')
        .complete()
        .request(async (app) => {
          await app.get('#form-draft-status-upload-button').trigger('click');
          return upload(app);
        })
        .respondWithData(() => {
          testData.extendedFormVersions.createNew({
            version: 'v2',
            draft: true
          });
          return { success: true };
        })
        .respondWithData(() => testData.extendedFormDrafts.last())
        .respondWithData(() => testData.standardFormAttachments.sorted())
        .afterResponses(app => {
          app.getComponent(FormNew).props().state.should.be.false();
        });
    });

    it('shows a success alert', () => {
      testData.extendedForms.createPast(1, { draft: true });
      return load('/projects/1/forms/f/draft')
        .complete()
        .request(async (app) => {
          await app.get('#form-draft-status-upload-button').trigger('click');
          return upload(app);
        })
        .respondWithData(() => {
          testData.extendedFormVersions.createNew({
            version: 'v2',
            draft: true
          });
          return { success: true };
        })
        .respondWithData(() => testData.extendedFormDrafts.last())
        .respondWithData(() => testData.standardFormAttachments.sorted())
        .afterResponses(app => {
          app.should.alert('success', 'Success! The new Form definition has been saved as your Draft.');
        });
    });

    it('shows the new version string', () => {
      testData.extendedForms.createPast(1, { draft: true });
      return load('/projects/1/forms/f/draft')
        .afterResponses(app => {
          const { version } = app.getComponent(FormVersionString).props();
          version.should.equal('v1');
        })
        .request(async (app) => {
          await app.get('#form-draft-status-upload-button').trigger('click');
          return upload(app);
        })
        .respondWithData(() => {
          testData.extendedFormVersions.createNew({
            version: 'v2',
            draft: true
          });
          return { success: true };
        })
        .respondWithData(() => testData.extendedFormDrafts.last())
        .respondWithData(() => testData.standardFormAttachments.sorted())
        .afterResponses(app => {
          const { version } = app.getComponent(FormVersionString).props();
          version.should.equal('v2');
        });
    });

    it('shows the updated count of missing attachments', () => {
      testData.extendedForms.createPast(1, { draft: true });
      testData.standardFormAttachments.createPast(1, { blobExists: false });
      return load('/projects/1/forms/f/draft')
        .afterResponses(app => {
          const badge = app.get('#form-head-draft-nav .nav-tabs .badge');
          badge.text().should.equal('1');
        })
        .request(async (app) => {
          await app.get('#form-draft-status-upload-button').trigger('click');
          return upload(app);
        })
        .respondWithData(() => {
          testData.extendedFormVersions.createNew({
            version: 'v2',
            draft: true
          });
          testData.standardFormAttachments.createNew({ blobExists: false });
          return { success: true };
        })
        .respondWithData(() => testData.extendedFormDrafts.last())
        .respondWithData(() => testData.standardFormAttachments.sorted())
        .afterResponses(app => {
          const badge = app.get('#form-head-draft-nav .nav-tabs .badge');
          badge.text().should.equal('2');
        });
    });

    it('updates the checklist', () => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, {
        submissions: 1,
        draft: true
      });
      testData.standardFormAttachments.createPast(1);
      return load('/projects/1/forms/f/draft')
        .afterResponses(app => {
          const steps = app.findAllComponents(ChecklistStep);
          steps.length.should.equal(4);
          steps[2].props().stage.should.equal('complete');
        })
        .request(async (app) => {
          await app.get('#form-draft-status-upload-button').trigger('click');
          return upload(app);
        })
        .respondWithData(() => {
          testData.extendedFormVersions.createNew({
            version: 'v2',
            draft: true
          });
          return { success: true };
        })
        .respondWithData(() => testData.extendedFormDrafts.last())
        .respondWithData(() => testData.standardFormAttachments.sorted())
        .afterResponses(app => {
          const steps = app.findAllComponents(ChecklistStep);
          steps.length.should.equal(4);
          steps[2].props().stage.should.equal('current');
        });
    });
  });

  describe('custom alert messages', () => {
    beforeEach(mockLogin);

    it('shows a message for an XLSForm error', () => {
      testData.extendedProjects.createPast(1);
      return mockHttp()
        .mount(FormNew, mountOptions())
        .request(upload)
        .respondWithProblem({
          code: 400.15,
          message: 'The given XLSForm file was not valid.',
          details: {
            error: 'Some XLSForm error',
            result: null,
            warnings: null
          }
        })
        .afterResponse(modal => {
          modal.should.alert('danger', 'The XLSForm could not be converted: Some XLSForm error');
        });
    });

    it('shows a message for a projectId,xmlFormId duplicate', () => {
      testData.extendedProjects.createPast(1);
      return mockHttp()
        .mount(FormNew, mountOptions())
        .request(upload)
        .respondWithProblem({
          code: 409.3,
          message: 'Some message',
          details: {
            table: 'forms',
            fields: ['projectId', 'xmlFormId'],
            values: ['1', 'f']
          }
        })
        .afterResponse(modal => {
          modal.should.alert('danger', 'A Form already exists in this Project with the Form ID of “f”.');
        });
    });

    it('shows a message for an xmlFormId mismatch', () => {
      testData.extendedForms.createPast(1, {
        xmlFormId: 'expected_id',
        draft: true
      });
      return mockHttp()
        .mount(FormNew, mountOptions())
        .request(upload)
        .respondWithProblem({
          code: 400.8,
          message: 'Some message',
          details: { field: 'xmlFormId', value: 'uploaded_id' }
        })
        .afterResponse(modal => {
          modal.should.alert(
            'danger',
            'The Form definition you have uploaded does not appear to be for this Form. It has the wrong formId (expected “expected_id”, got “uploaded_id”).'
          );
        });
    });
  });

  describe('XLSForm warnings', () => {
    beforeEach(mockLogin);

    const xlsFormWarning = {
      code: 400.16,
      message: 'The XLSForm is valid, but with warnings.',
      details: {
        error: null,
        result: '<a><b/></a>',
        warnings: ['warning 1', 'warning 2']
      }
    };

    it('shows the warnings', () => {
      testData.extendedProjects.createPast(1);
      return mockHttp()
        .mount(FormNew, mountOptions())
        .request(upload)
        .respondWithProblem(xlsFormWarning)
        .afterResponse(modal => {
          const warnings = modal.get('.modal-warnings');
          warnings.should.be.visible();
          const text = warnings.findAll('li').map(li => li.text());
          text.should.eql(['warning 1', 'warning 2']);
        });
    });

    it('hides the warnings after a new file is selected', () => {
      testData.extendedProjects.createPast(1);
      return mockHttp()
        .mount(FormNew, mountOptions())
        .request(upload)
        .respondWithProblem(xlsFormWarning)
        .afterResponse(async (modal) => {
          modal.get('.modal-warnings').should.be.visible();
          await setFiles(modal.get('input'), [xlsForm()]);
          modal.get('.modal-warnings').should.be.hidden();
        });
    });

    it('hides the warnings after a Problem is received', () => {
      testData.extendedProjects.createPast(1);
      return mockHttp()
        .mount(FormNew, mountOptions())
        .request(upload)
        .respondWithProblem(xlsFormWarning)
        .afterResponse(modal => {
          modal.get('.modal-warnings').should.be.visible();
          modal.should.not.alert();
        })
        .request(modal =>
          modal.get('.modal-warnings .btn-primary').trigger('click'))
        .respondWithProblem()
        .afterResponse(modal => {
          modal.get('.modal-warnings').should.be.hidden();
          modal.should.alert('danger');
        });
    });

    it('hides an alert after warnings are received', () => {
      testData.extendedProjects.createPast(1);
      return mockHttp()
        .mount(FormNew, mountOptions())
        .request(upload)
        .respondWithProblem()
        .afterResponse(modal => {
          modal.should.alert('danger');
          modal.get('.modal-warnings').should.be.hidden();
        })
        .request(modal => modal.get('#form-new-upload-button').trigger('click'))
        .respondWithProblem(xlsFormWarning)
        .afterResponse(modal => {
          modal.should.not.alert();
          modal.get('.modal-warnings').should.be.visible();
        });
    });

    describe('explanatory text', () => {
      it('shows the correct text for the new form modal', () => {
        testData.extendedProjects.createPast(1);
        return mockHttp()
          .mount(FormNew, mountOptions())
          .request(upload)
          .respondWithProblem(xlsFormWarning)
          .afterResponse(component => {
            const text = component.findAll('.modal-warnings p')[1].text();
            text.should.containEql('create the Form');
          });
      });

      it('shows the correct text when uploading a new definition', () => {
        testData.extendedForms.createPast(1, { draft: true });
        return mockHttp()
          .mount(FormNew, mountOptions())
          .request(upload)
          .respondWithProblem(xlsFormWarning)
          .afterResponse(component => {
            const text = component.findAll('.modal-warnings p')[1].text();
            text.should.containEql('update the Draft');
          });
      });
    });

    it('implements some standard button things for "Upload anyway" button', () => {
      testData.extendedProjects.createPast(1);
      return mockHttp()
        .mount(FormNew, mountOptions())
        .request(upload)
        .respondWithProblem(xlsFormWarning)
        .complete()
        .testStandardButton({
          button: '.modal-warnings .btn-primary',
          disabled: ['#form-new-upload-button', '.btn-link'],
          modal: true
        });
    });

    it('specifies ?ignoreWarnings=true if "Upload anyway" is clicked', () => {
      testData.extendedProjects.createPast(1);
      return mockHttp()
        .mount(FormNew, mountOptions())
        .request(upload)
        .beforeEachResponse((_, { url }) => {
          url.should.equal('/v1/projects/1/forms');
        })
        .respondWithProblem(xlsFormWarning)
        .complete()
        .request(modal =>
          modal.get('.modal-warnings .btn-primary').trigger('click'))
        .beforeEachResponse((_, { url }) => {
          url.should.equal('/v1/projects/1/forms?ignoreWarnings=true');
        })
        .respondWithProblem();
    });

    it('redirects to .../draft if "Upload anyway" is clicked', () => {
      testData.extendedProjects.createPast(1);
      return load('/projects/1')
        .afterResponses(app =>
          app.get('#form-list-create-button').trigger('click'))
        .request(upload)
        .respondWithProblem(xlsFormWarning)
        .complete()
        .request(app =>
          app.get('#form-new .modal-warnings .btn-primary').trigger('click'))
        .respondWithData(() =>
          testData.standardForms.createNew({ xmlFormId: 'f' }))
        .respondFor('/projects/1/forms/f/draft', { project: false })
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/projects/1/forms/f/draft');
        });
    });
  });
});

import ChecklistStep from '../../../src/components/checklist-step.vue';
import FormNew from '../../../src/components/form/new.vue';
import FormRow from '../../../src/components/form/row.vue';
import testData from '../../data';
import { dataTransfer, trigger } from '../../util/event';
import { load, mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';

const xlsForm = () => new File(
  [''],
  'my_form.xlsx',
  { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
);
const selectFileByInput = (modal, file) => {
  const input = modal.first('input[type="file"]');
  const target = { files: dataTransfer([file]).files };
  const event = $.Event('change', { target });
  $(input.element).trigger(event);
  return modal.vm.$nextTick().then(() => modal);
};
const upload = (app) => selectFileByInput(app.first(FormNew), xlsForm())
  .then(trigger.click('#form-new-upload-button'));

describe('FormNew', () => {
  describe('new form modal', () => {
    it('toggles the modal', () => {
      mockLogin();
      testData.extendedProjects.createPast(1);
      return load('/projects/1').testModalToggles(
        FormNew,
        '#form-list-create-button',
        '.btn-link'
      );
    });

    it('shows the correct modal title', () => {
      mockLogin();
      testData.extendedProjects.createPast(1);
      return load('/projects/1')
        .then(trigger.click('#form-list-create-button'))
        .then(app => {
          const text = app.first('#form-new .modal-title').text().trim();
          text.should.equal('Create Form');
        });
    });

    describe('.modal-introduction', () => {
      beforeEach(() => {
        mockLogin();
        testData.extendedProjects.createPast(1);
      });

      it('shows the correct text for the first paragraph', () =>
        load('/projects/1')
          .then(trigger.click('#form-list-create-button'))
          .then(app => {
            const p = app.first('#form-new .modal-introduction p');
            p.text().trim().should.startWith('To create a Form,');
          }));

      it('renders the paragraph about media files', () =>
        load('/projects/1')
          .then(trigger.click('#form-list-create-button'))
          .then(app => {
            const p = app.find('#form-new .modal-introduction p');
            p.length.should.equal(2);
            p[1].text().should.containEql('media');
          }));
    });
  });

  describe('modal for uploading a new definition', () => {
    beforeEach(() => {
      mockLogin();
      testData.extendedForms.createPast(1, { draft: true });
    });

    it('toggles the modal', () =>
      load('/projects/1/forms/f/draft').testModalToggles(
        FormNew,
        '#form-draft-status-upload-button',
        '.btn-link'
      ));

    it('shows the correct modal title', () =>
      load('/projects/1/forms/f/draft')
        .then(trigger.click('#form-draft-status-upload-button'))
        .then(app => {
          const text = app.first('#form-new .modal-title').text().trim();
          text.should.equal('Upload New Form Definition');
        }));

    describe('.modal-introduction', () => {
      it('shows the correct text', () =>
        load('/projects/1/forms/f/draft')
          .then(trigger.click('#form-draft-status-upload-button'))
          .then(app => {
            const p = app.first('#form-new .modal-introduction p');
            p.text().trim().should.startWith('To update the Draft,');
          }));

      it('does not render the paragraph about media files', () =>
        load('/projects/1/forms/f/draft')
          .then(trigger.click('#form-draft-status-upload-button'))
          .then(app => {
            app.find('#form-new .modal-introduction p').length.should.equal(1);
          }));
    });
  });

  describe('file selection', () => {
    beforeEach(mockLogin);

    it('shows an info alert if no file is selected', () => {
      const modal = mount(FormNew, {
        propsData: { state: true },
        requestData: { project: testData.extendedProjects.createPast(1).last() }
      });
      modal.should.not.alert();
      return trigger.click(modal, '#form-new-upload-button')
        .then(() => {
          modal.should.alert('info');
        });
    });

    it('hides the alert after a file is selected', () => {
      const modal = mount(FormNew, {
        propsData: { state: true },
        requestData: { project: testData.extendedProjects.createPast(1).last() }
      });
      return trigger.click(modal, '#form-new-upload-button')
        .then(() => {
          modal.should.alert('info');
        })
        .then(() => selectFileByInput(modal, xlsForm()))
        .then(() => {
          modal.should.not.alert();
        });
    });

    describe('after the file is selected using the file input', () => {
      beforeEach(() => {
        testData.extendedProjects.createPast(1);
      });

      it('sets the file data property', async () => {
        const modal = mount(FormNew, {
          propsData: { state: true },
          requestData: { project: testData.extendedProjects.last() }
        });
        await selectFileByInput(modal, xlsForm());
        modal.data().file.name.should.equal('my_form.xlsx');
      });

      it('resets the input', async () => {
        const modal = mount(FormNew, {
          propsData: { state: true },
          requestData: { project: testData.extendedProjects.last() }
        });
        await selectFileByInput(modal, xlsForm());
        modal.first('input').element.value.should.equal('');
      });
    });

    it('saves the file after it is dragged and dropped', () => {
      const modal = mount(FormNew, {
        propsData: { state: true },
        requestData: {
          project: testData.extendedProjects.createPast(1).last()
        }
      });
      return trigger.dragAndDrop(modal, '#form-new-drop-zone', [xlsForm()])
        .then(() => {
          modal.data().file.name.should.equal('my_form.xlsx');
        });
    });
  });

  describe('request url', () => {
    beforeEach(mockLogin);

    it('sends a request to .../forms when creating a form', () => {
      testData.extendedProjects.createPast(1);
      return load('/projects/1')
        .afterResponses(trigger.click('#form-list-create-button'))
        .request(upload)
        .beforeEachResponse((app, { url }) => {
          url.should.equal('/v1/projects/1/forms');
        })
        .respondWithProblem();
    });

    it('sends a request to .../draft when uploading a new definition', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'f', draft: true });
      return load('/projects/1/forms/f/draft')
        .afterResponses(trigger.click('#form-draft-status-upload-button'))
        .request(upload)
        .beforeEachResponse((app, { url }) => {
          url.should.equal('/v1/projects/1/forms/f/draft');
        })
        .respondWithProblem();
    });
  });

  describe('request headers', () => {
    beforeEach(mockLogin);

    it('sends the correct Content-Type header for an XML file', () =>
      mockHttp()
        .mount(FormNew, {
          propsData: { state: true },
          requestData: {
            project: testData.extendedProjects.createPast(1).last()
          }
        })
        .request(modal =>
          selectFileByInput(modal, new File(['<a><b/></a>'], 'my_form.xml'))
            .then(trigger.click('#form-new-upload-button')))
        .beforeEachResponse((modal, config) => {
          config.headers['Content-Type'].should.equal('application/xml');
        })
        .respondWithProblem());

    it('sends the correct headers for an .xlsx file', () =>
      mockHttp()
        .mount(FormNew, {
          propsData: { state: true },
          requestData: {
            project: testData.extendedProjects.createPast(1).last()
          }
        })
        .request(modal => selectFileByInput(modal, xlsForm())
          .then(trigger.click('#form-new-upload-button')))
        .beforeEachResponse((modal, config) => {
          config.headers['Content-Type'].should.equal('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          config.headers['X-XlsForm-FormId-Fallback'].should.equal('my_form');
        })
        .respondWithProblem());

    it('sends the correct headers for an .xls file', () =>
      mockHttp()
        .mount(FormNew, {
          propsData: { state: true },
          requestData: {
            project: testData.extendedProjects.createPast(1).last()
          }
        })
        .request(modal => {
          const type = 'application/vnd.ms-excel';
          const file = new File([''], 'my_form.xls', { type });
          return selectFileByInput(modal, file)
            .then(trigger.click('#form-new-upload-button'));
        })
        .beforeEachResponse((modal, config) => {
          config.headers['Content-Type'].should.equal('application/vnd.ms-excel');
          config.headers['X-XlsForm-FormId-Fallback'].should.equal('my_form');
        })
        .respondWithProblem());

    it('determines the content type based on the file extension', () =>
      mockHttp()
        .mount(FormNew, {
          propsData: { state: true },
          requestData: {
            project: testData.extendedProjects.createPast(1).last()
          }
        })
        .request(modal => {
          const file = new File([''], 'my_form.xlsx', { type: 'application/xml' });
          return selectFileByInput(modal, file)
            .then(trigger.click('#form-new-upload-button'));
        })
        .beforeEachResponse((modal, config) => {
          config.headers['Content-Type'].should.equal('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        })
        .respondWithProblem());
  });

  it('implements some standard button things for the upload button', () => {
    mockLogin();
    return mockHttp()
      .mount(FormNew, {
        propsData: { state: true },
        requestData: { project: testData.extendedProjects.createPast(1).last() }
      })
      .testStandardButton({
        button: '#form-new-upload-button',
        request: (modal) => selectFileByInput(modal, xlsForm())
          .then(trigger.click('#form-new-upload-button')),
        disabled: ['.modal-warnings .btn-primary', '.btn-link'],
        modal: true
      });
  });

  describe('after creating a form', () => {
    beforeEach(mockLogin);

    const createForm = () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'f1', name: 'Form 1' });
      return load('/projects/1')
        .afterResponses(trigger.click('#form-list-create-button'))
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
        const text = app.first('#form-head-form-nav .h1').text().trim();
        text.should.equal('Form 2');
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
          app.find(FormRow).length.should.equal(2);
        }));
  });

  describe('after uploading a new definition', () => {
    beforeEach(mockLogin);

    it('hides the modal', () => {
      testData.extendedForms.createPast(1, { draft: true });
      return load('/projects/1/forms/f/draft')
        .afterResponses(trigger.click('#form-draft-status-upload-button'))
        .request(upload)
        .respondWithSuccess()
        .respondWithData(() =>
          testData.extendedFormDrafts.createNew({ version: 'v2', draft: true }))
        .respondWithData(() => testData.standardFormAttachments.sorted())
        .afterResponses(app => {
          app.first(FormNew).getProp('state').should.be.false();
        });
    });

    it('shows a success alert', () => {
      testData.extendedForms.createPast(1, { draft: true });
      return load('/projects/1/forms/f/draft')
        .afterResponses(trigger.click('#form-draft-status-upload-button'))
        .request(upload)
        .respondWithSuccess()
        .respondWithData(() =>
          testData.extendedFormDrafts.createNew({ version: 'v2', draft: true }))
        .respondWithData(() => testData.standardFormAttachments.sorted())
        .afterResponses(app => {
          app.should.alert('success', 'Success! The new Form definition has been saved as your Draft.');
        });
    });

    it('shows the new version string', () => {
      testData.extendedForms.createPast(1, { draft: true });
      return load('/projects/1/forms/f/draft')
        .afterResponses(app => {
          const version = app.first('.form-version-summary-item .version');
          version.text().trim().should.equal('v1');
        })
        .request(async (app) => {
          await trigger.click(app, '#form-draft-status-upload-button');
          await upload(app);
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
          const version = app.first('.form-version-summary-item .version');
          version.text().trim().should.equal('v2');
        });
    });

    it('shows the updated count of missing attachments', () => {
      testData.extendedForms.createPast(1, { draft: true });
      testData.standardFormAttachments.createPast(1, { exists: false });
      return load('/projects/1/forms/f/draft')
        .afterResponses(app => {
          const badge = app.first('#form-head-draft-nav .nav-tabs .badge');
          badge.text().trim().should.equal('1');

          return trigger.click(app, '#form-draft-status-upload-button');
        })
        .request(upload)
        .respondWithSuccess()
        .respondWithData(() =>
          testData.extendedFormDrafts.createNew({ version: 'v2', draft: true }))
        .respondWithData(() => testData.standardFormAttachments
          .createPast(1, { exists: false })
          .sorted())
        .afterResponses(app => {
          const badge = app.first('#form-head-draft-nav .nav-tabs .badge');
          badge.text().trim().should.equal('2');
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
          const steps = app.find(ChecklistStep);
          steps.length.should.equal(4);
          steps[2].getProp('stage').should.equal('complete');

          return trigger.click(app, '#form-draft-status-upload-button');
        })
        .request(upload)
        .respondWithSuccess()
        .respondWithData(() =>
          testData.extendedFormDrafts.createNew({ version: 'v2', draft: true }))
        .respondWithData(() => testData.standardFormAttachments.sorted())
        .afterResponses(app => {
          const steps = app.find(ChecklistStep);
          steps.length.should.equal(4);
          steps[2].getProp('stage').should.equal('current');
        });
    });
  });

  describe('custom alert messages', () => {
    beforeEach(mockLogin);

    it('shows a message for an XLSForm error', () =>
      mockHttp()
        .mount(FormNew, {
          propsData: { state: true },
          requestData: {
            project: testData.extendedProjects.createPast(1).last()
          }
        })
        .request(modal => selectFileByInput(modal, xlsForm())
          .then(trigger.click('#form-new-upload-button')))
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
        }));

    it('shows a message for a projectId,xmlFormId duplicate', () =>
      mockHttp()
        .mount(FormNew, {
          propsData: { state: true },
          requestData: {
            project: testData.extendedProjects.createPast(1).last()
          }
        })
        .request(modal => selectFileByInput(modal, xlsForm())
          .then(trigger.click('#form-new-upload-button')))
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
        }));

    it('shows a message for an xmlFormId mismatch', () => {
      const project = testData.extendedProjects
        .createPast(1, { forms: 1 })
        .last();
      testData.extendedForms.createPast(1, {
        xmlFormId: 'expected_id',
        draft: true
      });
      const formDraft = testData.extendedFormDrafts.last();
      return mockHttp()
        .mount(FormNew, {
          propsData: { state: true },
          requestData: { project, formDraft }
        })
        .request(modal => selectFileByInput(modal, xlsForm())
          .then(trigger.click('#form-new-upload-button')))
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

    it('shows the warnings', () =>
      mockHttp()
        .mount(FormNew, {
          propsData: { state: true },
          requestData: {
            project: testData.extendedProjects.createPast(1).last()
          }
        })
        .request(modal => selectFileByInput(modal, xlsForm())
          .then(trigger.click('#form-new-upload-button')))
        .respondWithProblem(xlsFormWarning)
        .afterResponse(modal => {
          const warnings = modal.first('.modal-warnings');
          warnings.should.be.visible();
          warnings.find('li').map(li => li.text()).should.eql(
            ['warning 1', 'warning 2']
          );
        }));

    it('hides the warnings after a new file is selected', () =>
      mockHttp()
        .mount(FormNew, {
          propsData: { state: true },
          requestData: {
            project: testData.extendedProjects.createPast(1).last()
          }
        })
        .request(modal => selectFileByInput(modal, xlsForm())
          .then(trigger.click('#form-new-upload-button')))
        .respondWithProblem(xlsFormWarning)
        .afterResponse(modal => {
          modal.first('.modal-warnings').should.be.visible();
          return modal;
        })
        .then(modal => selectFileByInput(modal, xlsForm()))
        .then(modal => {
          modal.first('.modal-warnings').should.be.hidden();
        }));

    it('hides the warnings after a Problem is received', () =>
      mockHttp()
        .mount(FormNew, {
          propsData: { state: true },
          requestData: {
            project: testData.extendedProjects.createPast(1).last()
          }
        })
        .request(modal => selectFileByInput(modal, xlsForm())
          .then(trigger.click('#form-new-upload-button')))
        .respondWithProblem(xlsFormWarning)
        .afterResponse(modal => {
          modal.first('.modal-warnings').should.be.visible();
          modal.should.not.alert();
        })
        .request(trigger.click('.modal-warnings .btn-primary'))
        .respondWithProblem()
        .afterResponse(modal => {
          modal.first('.modal-warnings').should.be.hidden();
          modal.should.alert('danger');
        }));

    it('hides an alert after warnings are received', () =>
      mockHttp()
        .mount(FormNew, {
          propsData: { state: true },
          requestData: {
            project: testData.extendedProjects.createPast(1).last()
          }
        })
        .request(modal => selectFileByInput(modal, xlsForm())
          .then(trigger.click('#form-new-upload-button')))
        .respondWithProblem()
        .afterResponse(modal => {
          modal.should.alert('danger');
          modal.first('.modal-warnings').should.be.hidden();
        })
        .request(trigger.click('#form-new-upload-button'))
        .respondWithProblem(xlsFormWarning)
        .afterResponse(modal => {
          modal.should.not.alert();
          modal.first('.modal-warnings').should.be.visible();
        }));

    describe('explanatory text', () => {
      it('shows the correct text for the new form modal', () => {
        testData.extendedProjects.createPast(1);
        return load('/projects/1')
          .afterResponses(trigger.click('#form-list-create-button'))
          .request(upload)
          .respondWithProblem(xlsFormWarning)
          .afterResponse(app => {
            const text = app.find('#form-new .modal-warnings p')[1].text();
            text.should.containEql('create the Form');
          });
      });

      it('shows the correct text when uploading a new definition', () => {
        testData.extendedForms.createPast(1, { draft: true });
        return load('/projects/1/forms/f/draft')
          .afterResponses(trigger.click('#form-draft-status-upload-button'))
          .request(upload)
          .respondWithProblem(xlsFormWarning)
          .afterResponse(app => {
            const text = app.find('#form-new .modal-warnings p')[1].text();
            text.should.containEql('update the Draft');
          });
      });
    });

    it('implements some standard button things for "Upload anyway" button', () =>
      mockHttp()
        .mount(FormNew, {
          propsData: { state: true },
          requestData: {
            project: testData.extendedProjects.createPast(1).last()
          }
        })
        .request(modal => selectFileByInput(modal, xlsForm())
          .then(trigger.click('#form-new-upload-button')))
        .respondWithProblem(xlsFormWarning)
        .complete()
        .testStandardButton({
          button: '.modal-warnings .btn-primary',
          disabled: ['#form-new-upload-button', '.btn-link'],
          modal: true
        }));

    it('sends ?ignoreWarnings=true if "Upload anyway" is clicked', () =>
      mockHttp()
        .mount(FormNew, {
          propsData: { state: true },
          requestData: {
            project: testData.extendedProjects.createPast(1).last()
          }
        })
        .request(modal => selectFileByInput(modal, xlsForm())
          .then(trigger.click('#form-new-upload-button')))
        .beforeEachResponse((modal, config) => {
          config.url.should.equal('/v1/projects/1/forms');
        })
        .respondWithProblem(xlsFormWarning)
        .complete()
        .request(trigger.click('.modal-warnings .btn-primary'))
        .beforeEachResponse((modal, config) => {
          config.url.should.equal('/v1/projects/1/forms?ignoreWarnings=true');
        })
        .respondWithProblem());

    it('redirects to .../draft if "Upload anyway" is clicked', () => {
      testData.extendedProjects.createPast(1);
      return load('/projects/1')
        .afterResponses(trigger.click('#form-list-create-button'))
        .request(upload)
        .respondWithProblem(xlsFormWarning)
        .complete()
        .request(trigger.click('#form-new .modal-warnings .btn-primary'))
        .respondWithData(() =>
          testData.standardForms.createNew({ xmlFormId: 'f' }))
        .respondFor('/projects/1/forms/f/draft', { project: false })
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/projects/1/forms/f/draft');
        });
    });
  });
});

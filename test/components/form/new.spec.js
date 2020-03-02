import FormNew from '../../../src/components/form/new.vue';
import FormRow from '../../../src/components/form/row.vue';
import testData from '../../data';
import { dataTransfer, trigger } from '../../util/event';
import { load, mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mountAndMark } from '../../util/lifecycle';

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

describe('FormNew', () => {
  describe('new form modal', () => {
    it('does not show the new form button to a project viewer', () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'viewer' });
      return load('/projects/1').then(app => {
        app.find('#project-overview-new-form-button').length.should.equal(0);
      });
    });

    it('toggles the modal', () => {
      mockLogin();
      testData.extendedProjects.createPast(1);
      return load('/projects/1').testModalToggles(
        FormNew,
        '#project-overview-new-form-button',
        '.btn-link'
      );
    });

    it('shows the correct modal title', () => {
      mockLogin();
      testData.extendedProjects.createPast(1);
      return load('/projects/1')
        .then(trigger.click('#project-overview-new-form-button'))
        .then(app => {
          const text = app.first('#form-new .modal-title').text().trim();
          text.should.equal('Create Form');
        });
    });

    it('renders the paragraph about media files', () => {
      mockLogin();
      testData.extendedProjects.createPast(1);
      return load('/projects/1')
        .then(trigger.click('#project-overview-new-form-button'))
        .then(app => {
          const p = app.find('#form-new .modal-introduction p');
          p.length.should.equal(2);
          p[1].text().trim().should.containEql('media');
        });
    });
  });

  describe('upload new draft modal', () => {
    beforeEach(() => {
      mockLogin();
      testData.extendedProjects.createPast(1, { forms: 1 });
      testData.extendedForms.createPast(1, { xmlFormId: 'f', draft: true });
    });

    it('toggles the modal', () =>
      load('/projects/1/forms/f/draft/status').testModalToggles(
        FormNew,
        '#form-draft-status-upload-button',
        '.btn-link'
      ));

    it('shows the correct modal title', () =>
      load('/projects/1/forms/f/draft/status').then(app => {
        const text = app.first('#form-new .modal-title').text().trim();
        text.should.equal('Upload New Form Definition');
      }));

    it('does not render the paragraph about media files', () =>
      load('/projects/1/forms/f/draft/status').then(app => {
        app.find('#form-new .modal-introduction p').length.should.equal(1);
      }));
  });

  describe('file selection', () => {
    beforeEach(mockLogin);

    it('shows an info alert if no file is selected', () => {
      const modal = mountAndMark(FormNew, {
        propsData: { state: true },
        requestData: { project: testData.extendedProjects.createPast(1).last() }
      });
      modal.should.not.alert();
      return trigger.click(modal, '#form-new-create-button')
        .then(() => {
          modal.should.alert('info');
        });
    });

    it('hides the alert after a file is selected', () => {
      const modal = mountAndMark(FormNew, {
        propsData: { state: true },
        requestData: { project: testData.extendedProjects.createPast(1).last() }
      });
      return trigger.click(modal, '#form-new-create-button')
        .then(() => {
          modal.should.alert('info');
        })
        .then(() => selectFileByInput(modal, xlsForm()))
        .then(() => {
          modal.should.not.alert();
        });
    });

    it('saves the file after it is selected using the file input', () => {
      const modal = mountAndMark(FormNew, {
        propsData: { state: true },
        requestData: {
          project: testData.extendedProjects.createPast(1).last()
        }
      });
      return selectFileByInput(modal, xlsForm())
        .then(() => {
          modal.data().file.name.should.equal('my_form.xlsx');
        });
    });

    it('saves the file after it is dragged and dropped', () => {
      const modal = mountAndMark(FormNew, {
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
        .complete()
        .request(app => trigger.click(app, '#project-overview-new-form-button')
          .then(() => selectFileByInput(app.first(FormNew), xlsForm()))
          .then(trigger.click('#form-new-create-button')))
        .beforeEachResponse((app, { url }) => {
          url.should.equal('/v1/projects/1/forms');
        })
        .respondWithProblem();
    });

    it('sends a request to .../draft when uploading a new draft', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'f', draft: true });
      return load('/projects/1/forms/f/draft/status')
        .complete()
        .request(app => trigger.click(app, '#form-draft-status-upload-button')
          .then(() => selectFileByInput(app.first(FormNew), xlsForm()))
          .then(trigger.click('#form-new-create-button')))
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
            .then(() => trigger.click(modal, '#form-new-create-button')))
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
          .then(() => trigger.click(modal, '#form-new-create-button')))
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
            .then(() => trigger.click(modal, '#form-new-create-button'));
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
            .then(() => trigger.click(modal, '#form-new-create-button'));
        })
        .beforeEachResponse((modal, config) => {
          config.headers['Content-Type'].should.equal('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        })
        .respondWithProblem());
  });

  it('implements some standard button things for the create button', () => {
    mockLogin();
    return mockHttp()
      .mount(FormNew, {
        propsData: { state: true },
        requestData: { project: testData.extendedProjects.createPast(1).last() }
      })
      .testStandardButton({
        request: (modal) => selectFileByInput(modal, xlsForm())
          .then(trigger.click('#form-new-create-button')),
        button: '#form-new-create-button',
        disabled: ['.modal-warnings .btn-primary', '.btn-link'],
        modal: true
      });
  });

  describe('after creating a form', () => {
    beforeEach(mockLogin);

    const createForm = () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'f1', name: 'Form 1' });
      return load('/projects/1')
        .complete()
        .request(app => trigger.click(app, '#project-overview-new-form-button')
          .then(() => selectFileByInput(app.first(FormNew), xlsForm()))
          .then(trigger.click('#form-new-create-button')))
        .respondWithData(() =>
          testData.standardForms.createNew({ xmlFormId: 'f2', name: 'Form 2' }))
        .respondFor('/projects/1/forms/f2/draft/status', { project: false });
    };

    it('redirects to .../draft/status', () =>
      createForm().then(app => {
        app.vm.$route.path.should.equal('/projects/1/forms/f2/draft/status');
      }));

    it('shows the form name', () =>
      createForm().then(app => {
        const text = app.first('#form-head-form-nav .h1').text().trim();
        text.should.equal('Form 2');
      }));

    it('shows a success alert', () =>
      createForm().then(app => {
        app.should.alert('success');
      }));

    it('renders the correct number of rows in the forms table', () =>
      createForm()
        .complete()
        .load('/projects/1', { project: false })
        .afterResponses(app => {
          app.find(FormRow).length.should.equal(2);
        }));
  });

  describe('after uploading a new draft', () => {
    beforeEach(mockLogin);

    const uploadDraft = () => {
      testData.extendedForms.createPast(1, {
        xmlFormId: 'f',
        version: 'v1',
        draft: true
      });
      testData.standardFormAttachments.createPast(1, { exists: false });
      return load('/projects/1/forms/f/draft/status')
        .complete()
        .request(app => trigger.click(app, '#form-draft-status-upload-button')
          .then(() => selectFileByInput(app.first(FormNew), xlsForm()))
          .then(trigger.click('#form-new-create-button')))
        .respondWithSuccess()
        .respondWithData(() => testData.extendedFormDrafts
          .createPast(1, { version: 'v2', draft: true })
          .last())
        .respondWithData(() => testData.standardFormAttachments
          .createPast(1, { exists: false })
          .sorted());
    };

    it('hides the modal', () =>
      uploadDraft().then(app => {
        app.first(FormNew).getProp('state').should.be.false();
      }));

    it('shows a success alert', () =>
      uploadDraft().then(app => {
        app.should.alert('success');
      }));

    it('shows the new version string', () =>
      uploadDraft().then(app => {
        const text = app.first('.form-version-summary-item-version').text().trim();
        text.should.equal('v2');
      }));

    it('shows the updated count of missing attachments', () =>
      uploadDraft().then(app => {
        const badge = app.first('#form-head-draft-nav .nav-tabs .badge');
        badge.text().trim().should.equal('2');
      }));

    // TODO
    it('updates the checklist');
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
          .then(() => trigger.click(modal, '#form-new-create-button')))
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
          .then(() => trigger.click(modal, '#form-new-create-button')))
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
          modal.should.alert('danger', 'A Form already exists in this Project with the Form ID of "f".');
        }));

    it('shows a message for an xmlFormId mismatch', () =>
      mockHttp()
        .mount(FormNew, {
          propsData: { state: true },
          requestData: {
            project: testData.extendedProjects
              .createPast(1, { forms: 1 })
              .last(),
            form: testData.extendedForms
              .createPast(1, { xmlFormId: 'expected_id', draft: true })
              .last(),
            formDraft: testData.extendedFormDrafts.last(),
            attachments: []
          }
        })
        .request(modal => selectFileByInput(modal, xlsForm())
          .then(() => trigger.click(modal, '#form-new-create-button')))
        .respondWithProblem({
          code: 400.8,
          message: 'Some message',
          details: { field: 'xmlFormId', value: 'uploaded_id' }
        })
        .afterResponse(modal => {
          modal.should.alert(
            'danger',
            'The Form definition you have uploaded does not appear to be for this Form. It has the wrong formId (expected "expected_id", got "uploaded_id").'
          );
        }));
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
          .then(() => trigger.click(modal, '#form-new-create-button')))
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
          .then(() => trigger.click(modal, '#form-new-create-button')))
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
          .then(() => trigger.click(modal, '#form-new-create-button')))
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
          .then(() => trigger.click(modal, '#form-new-create-button')))
        .respondWithProblem()
        .afterResponse(modal => {
          modal.should.alert('danger');
          modal.first('.modal-warnings').should.be.hidden();
        })
        .request(modal => trigger.click(modal, '#form-new-create-button'))
        .respondWithProblem(xlsFormWarning)
        .afterResponse(modal => {
          modal.should.not.alert();
          modal.first('.modal-warnings').should.be.visible();
        }));

    it('implements some standard button things for "Create anyway" button', () =>
      mockHttp()
        .mount(FormNew, {
          propsData: { state: true },
          requestData: {
            project: testData.extendedProjects.createPast(1).last()
          }
        })
        .request(modal => selectFileByInput(modal, xlsForm())
          .then(trigger.click('#form-new-create-button')))
        .respondWithProblem(xlsFormWarning)
        .complete()
        .testStandardButton({
          button: '.modal-warnings .btn-primary',
          disabled: ['#form-new-create-button', '.btn-link'],
          modal: true
        }));

    it('sends ?ignoreWarnings=true if "Create anyway" is clicked', () =>
      mockHttp()
        .mount(FormNew, {
          propsData: { state: true },
          requestData: {
            project: testData.extendedProjects.createPast(1).last()
          }
        })
        .request(modal => selectFileByInput(modal, xlsForm())
          .then(() => trigger.click(modal, '#form-new-create-button')))
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

    it('redirects to .../draft/status if "Create anyway" is clicked', () => {
      testData.extendedProjects.createPast(1);
      return load('/projects/1')
        .complete()
        .request(app => trigger.click(app, '#project-overview-new-form-button')
          .then(() => selectFileByInput(app.first(FormNew), xlsForm()))
          .then(() => trigger.click(app, '#form-new-create-button')))
        .respondWithProblem(xlsFormWarning)
        .complete()
        .request(trigger.click('.modal-warnings .btn-primary'))
        .respondWithData(() =>
          testData.standardForms.createNew({ xmlFormId: 'f' }))
        .respondFor('/projects/1/forms/f/draft/status', { project: false })
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/projects/1/forms/f/draft/status');
        });
    });
  });
});

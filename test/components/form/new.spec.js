import FormNew from '../../../src/components/form/new.vue';
import testData from '../../data';
import { dataTransfer, trigger } from '../../event';
import { mockHttp, mockRoute } from '../../http';
import { mockLogin } from '../../session';
import { mountAndMark } from '../../destroy';

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
  it('does not show the button to a project viewer', () => {
    mockLogin({ role: 'none' });
    return mockRoute('/projects/1')
      .respondWithData(() => testData.extendedProjects
        .createPast(1, { role: 'viewer', forms: 0 })
        .last())
      .respondWithData(() => testData.extendedForms.sorted())
      .afterResponses(app => {
        app.find('#project-overview-new-form-button').length.should.equal(0);
      });
  });

  it('shows the modal after the button is clicked', () => {
    mockLogin();
    return mockRoute('/projects/1')
      .respondWithData(() => testData.extendedProjects.createPast(1).last())
      .respondWithData(() => testData.extendedForms.createPast(1).sorted())
      .afterResponses(app => {
        app.first(FormNew).getProp('state').should.be.false();
        return app;
      })
      .then(app => trigger.click(app, '#project-overview-new-form-button'))
      .then(app => {
        app.first(FormNew).getProp('state').should.be.true();
      });
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
        // It is easier to return a Problem than a series of responses.
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

  it('implements some standard button things', () => {
    mockLogin();
    return mockHttp()
      .mount(FormNew, {
        propsData: { state: true },
        requestData: { project: testData.extendedProjects.createPast(1).last() }
      })
      .request(modal => selectFileByInput(modal, xlsForm())
        .then(() => trigger.click(modal, '#form-new-create-button')))
      .standardButton('#form-new-create-button');
  });

  describe('after a successful response', () => {
    beforeEach(mockLogin);

    let app;
    beforeEach(() => mockRoute('/projects/1')
      .respondWithData(() => testData.extendedProjects.createPast(1).last())
      .respondWithData(() => testData.extendedForms.createPast(1).sorted())
      .afterResponse(component => {
        app = component;
      })
      .request(() => trigger.click(app, '#project-overview-new-form-button')
        .then(() => selectFileByInput(app.first(FormNew), xlsForm()))
        .then(() => trigger.click(app, '#form-new-create-button')))
      .respondWithData(() => testData.standardForms
        .createNew({ xmlFormId: 'f', name: 'My Form' })) // FormNew
      .respondWithData(() => testData.extendedForms.last()) // FormShow
      .respondWithData(() => testData.extendedFormAttachments.sorted())
      .respondWithData(() => [])); // assignmentActors

    it('redirects to the form overview', () => {
      app.vm.$route.path.should.equal('/projects/1/forms/f');
    });

    it('shows the form name', () => {
      app.first('#page-head-title').text().trim().should.equal('My Form');
    });

    it('shows a success alert', () => {
      app.should.alert('success');
    });

    it('renders the correct number of rows in the forms table', () =>
      mockHttp()
        .route('/projects/1')
        .respondWithData(() => testData.extendedForms.sorted())
        .afterResponse(() => {
          app.find('#form-list-table tbody tr').length.should.equal(2);
        }));
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
        .respondWithProblem(() => ({
          code: 400.15,
          message: 'The given XLSForm file was not valid.',
          details: {
            error: 'Some XLSForm error',
            result: null,
            warnings: null
          }
        }))
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
        .respondWithProblem(() => ({
          code: 409.3,
          message: 'Some message',
          details: {
            table: 'forms',
            fields: ['projectId', 'xmlFormId'],
            values: ['1', 'f']
          }
        }))
        .afterResponse(modal => {
          modal.should.alert('danger', 'A Form already exists in this Project with the Form ID of "f".');
        }));

    it('shows a message for a projectId,xmlFormId,version duplicate', () =>
      mockHttp()
        .mount(FormNew, {
          propsData: { state: true },
          requestData: {
            project: testData.extendedProjects.createPast(1).last()
          }
        })
        .request(modal => selectFileByInput(modal, xlsForm())
          .then(() => trigger.click(modal, '#form-new-create-button')))
        .respondWithProblem(() => ({
          code: 409.3,
          message: 'Some message',
          details: {
            table: 'forms',
            fields: ['projectId', 'xmlFormId', 'version'],
            values: ['1', 'f', '1']
          }
        }))
        .afterResponse(modal => {
          modal.should.alert('danger', 'A Form previously existed in this Project with the same Form ID and version as the Form you are attempting to create now. To prevent confusion, please change one or both and try creating the Form again.');
        }));
  });

  describe('XLSForm warnings', () => {
    beforeEach(mockLogin);

    const xlsFormWarning = () => ({
      code: 400.16,
      message: 'The XLSForm is valid, but with warnings.',
      details: {
        error: null,
        result: '<a><b/></a>',
        warnings: ['warning 1', 'warning 2']
      }
    });

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
          const warnings = modal.first('#form-new-warnings');
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
          modal.first('#form-new-warnings').should.be.visible();
          return modal;
        })
        .then(modal => selectFileByInput(modal, xlsForm()))
        .then(modal => {
          modal.first('#form-new-warnings').should.not.be.visible();
        }));

    it('hides the warnings after an alert is received', () =>
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
          modal.first('#form-new-warnings').should.be.visible();
          modal.should.not.alert();
        })
        .request(modal =>
          trigger.click(modal, '#form-new-warnings .btn-primary'))
        .respondWithProblem()
        .afterResponse(modal => {
          modal.first('#form-new-warnings').should.not.be.visible();
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
          modal.first('#form-new-warnings').should.not.be.visible();
        })
        .request(modal => trigger.click(modal, '#form-new-create-button'))
        .respondWithProblem(xlsFormWarning)
        .afterResponse(modal => {
          modal.should.not.alert();
          modal.first('#form-new-warnings').should.be.visible();
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
        .request(modal => trigger.click(modal, '#form-new-warnings .btn-primary'))
        .beforeEachResponse((modal, config) => {
          config.url.should.equal('/v1/projects/1/forms?ignoreWarnings=true');
        })
        .respondWithProblem());

    it('redirects to the form overview if "Create anyway" is clicked', () =>
      mockRoute('/projects/1')
        .respondWithData(() => testData.extendedProjects
          .createPast(1, { forms: 0 })
          .last())
        .respondWithData(() => testData.extendedForms.sorted())
        .complete()
        .request(app => trigger.click(app, '#project-overview-new-form-button')
          .then(() => selectFileByInput(app.first(FormNew), xlsForm()))
          .then(() => trigger.click(app, '#form-new-create-button')))
        .respondWithProblem(xlsFormWarning)
        .complete()
        .request(app => trigger.click(app, '#form-new-warnings .btn-primary'))
        .respondWithData(() => testData.standardForms
          .createNew({ xmlFormId: 'f', name: 'My Form' })) // FormNew
        .respondWithData(() => testData.extendedForms.last()) // FormShow
        .respondWithData(() => testData.extendedFormAttachments.sorted())
        .respondWithData(() => []) // assignmentActors
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/projects/1/forms/f');
        }));
  });
});

import FormNew from '../../../src/components/form/new.vue';
import testData from '../../data';
import { dataTransfer, trigger } from '../../event';
import { mockHttp, mockRoute } from '../../http';
import { mockLogin } from '../../session';
import { mountAndMark } from '../../destroy';

const xmlFile = () => new File(['<a><b/></a>'], 'my_form.xml');
const xlsxFile = () => new File(
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
const dragAndDrop = (modal) =>
  trigger.dragAndDrop(modal, '#form-new-drop-zone', [xmlFile()]);

const waitForRead = (modal) => {
  if (modal.data().file != null) return modal.vm.$nextTick().then(() => modal);
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(waitForRead(modal));
    });
  });
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

  it('shows an info alert if no file is selected', () => {
    mockLogin();
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

  const xmlFileSelectionMethods = [
    [
      'selecting an XML file using the file input',
      (modal) => selectFileByInput(modal, xmlFile())
    ],
    [
      'dragging and dropping an XML file',
      dragAndDrop
    ]
  ];
  for (const [description, selectFile] of xmlFileSelectionMethods) {
    describe(description, () => {
      beforeEach(mockLogin);

      it('disables the Create button while reading an XML file', () => {
        const modal = mountAndMark(FormNew, {
          propsData: { state: true },
          requestData: {
            project: testData.extendedProjects.createPast(1).last()
          }
        });
        return selectFile(modal)
          .then(() => {
            modal.data().reading.should.be.true();
            modal.first('#form-new-create-button').should.be.disabled();
          })
          .then(() => waitForRead(modal));
      });

      it('updates the modal after reading an XML file', () => {
        const modal = mountAndMark(FormNew, {
          propsData: { state: true },
          requestData: {
            project: testData.extendedProjects.createPast(1).last()
          }
        });
        return selectFile(modal)
          .then(waitForRead)
          .then(() => {
            modal.data().file.name.should.equal('my_form.xml');
            modal.data().reading.should.be.false();
            modal.data().xml.should.equal('<a><b/></a>');
            modal.first('#form-new-create-button').should.not.be.disabled();
          });
      });
    });
  }

  it('updates the modal after processing an .xlsx file', () => {
    mockLogin();
    const modal = mountAndMark(FormNew, {
      propsData: { state: true },
      requestData: {
        project: testData.extendedProjects.createPast(1).last()
      }
    });
    return selectFileByInput(modal, xlsxFile())
      .then(() => {
        modal.data().file.name.should.equal('my_form.xlsx');
        modal.data().reading.should.be.false();
        should.not.exist(modal.data().xml);
        modal.first('#form-new-create-button').should.not.be.disabled();
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
        .request(modal => selectFileByInput(modal, xmlFile())
          .then(waitForRead)
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
          requestData: { project: testData.extendedProjects.createPast(1).last() }
        })
        .request(modal => selectFileByInput(modal, xlsxFile())
          .then(() => trigger.click(modal, '#form-new-create-button')))
        .beforeEachResponse((modal, config) => {
          config.headers['Content-Type'].should.equal('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          config.headers['X-XlsForm-FormId-Fallback'].should.equal('my_form');
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
      .request(modal => selectFileByInput(modal, xmlFile())
        .then(waitForRead)
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
        .then(() => selectFileByInput(app.first(FormNew), xmlFile()))
        .then(waitForRead)
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
        .request(modal => selectFileByInput(modal, xlsxFile())
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
        .request(modal => selectFileByInput(modal, xmlFile())
          .then(waitForRead)
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
        .request(modal => selectFileByInput(modal, xmlFile())
          .then(waitForRead)
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
    const uploadXLSFormWithWarnings = () => {
      mockLogin();
      return mockRoute('/projects/1')
        .respondWithData(() => testData.extendedProjects
          .createPast(1, { forms: 0 })
          .last())
        .respondWithData(() => testData.extendedForms.sorted())
        .complete()
        .request(app => trigger.click(app, '#project-overview-new-form-button')
          .then(() => selectFileByInput(app.first(FormNew), xlsxFile()))
          .then(() => trigger.click(app, '#form-new-create-button')))
        .respondWithProblem(() => ({
          code: 400.16,
          message: 'The XLSForm is valid, but with warnings.',
          details: {
            error: null,
            result: '<a><b/></a>',
            warnings: ['warning 1', 'warning 2']
          }
        }));
    };

    it('shows the warnings', () =>
      uploadXLSFormWithWarnings().afterResponse(app => {
        const warnings = app.first('#form-new-warnings');
        warnings.should.be.visible();
        warnings.find('li').map(li => li.text()).should.eql(
          ['warning 1', 'warning 2']
        );
      }));

    it('sends ?ignoreWarnings=true if "Create anyway" is clicked', () =>
      uploadXLSFormWithWarnings()
        .beforeEachResponse((app, config) => {
          config.url.should.equal('/v1/projects/1/forms');
        })
        .complete()
        .request(app => trigger.click(app, '#form-new-warnings .btn-primary'))
        .beforeEachResponse((app, config) => {
          config.url.should.equal('/v1/projects/1/forms?ignoreWarnings=true');
        })
        .respondWithProblem());

    it('redirects to the form overview if "Create anyway" is clicked', () =>
      uploadXLSFormWithWarnings()
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

import { clone } from 'ramda';

import FileDropZone from '../../../src/components/file-drop-zone.vue';
import FormNew from '../../../src/components/form/new.vue';
import FormVersionString from '../../../src/components/form-version/string.vue';

import testData from '../../data';
import { dragAndDrop, setFiles } from '../../util/trigger';
import { load, mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';
import { mount } from '../../util/lifecycle';

const mountOptions = () => {
  const formVersion = testData.extendedForms.size !== 0
    ? testData.extendedFormVersions.last()
    : null;
  const draft = formVersion != null && formVersion.publishedAt == null;
  const encodedFormId = draft
    ? encodeURIComponent(formVersion.xmlFormId)
    : null;
  return {
    props: { state: true },
    container: {
      router: mockRouter(!draft
        ? '/projects/1'
        : `/projects/1/forms/${encodedFormId}/draft`)
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
        text.should.include('Form Attachments');
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
        show: '#form-edit-upload-button',
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

    describe('after a file is selected using the file input', () => {
      it('shows the filename', async () => {
        const modal = mount(FormNew, mountOptions());
        await setFiles(modal.get('input'), [xlsForm()]);
        modal.get('#form-new-filename').text().should.equal('my_form.xlsx');
      });

      it('resets the input', async () => {
        const modal = mount(FormNew, mountOptions());
        await setFiles(modal.get('input'), [xlsForm()]);
        modal.get('input').element.value.should.equal('');
      });
    });

    it('shows the filename after a file is dropped', async () => {
      const modal = mount(FormNew, mountOptions());
      await dragAndDrop(modal.getComponent(FileDropZone), [xlsForm()]);
      modal.get('#form-new-filename').text().should.equal('my_form.xlsx');
    });
  });

  describe('request', () => {
    beforeEach(mockLogin);

    it('sends the correct request when creating a form', () => {
      testData.extendedProjects.createPast(1);
      return mockHttp()
        .mount(FormNew, mountOptions())
        .request(upload)
        .beforeEachResponse((_, { method, url, data }) => {
          method.should.equal('POST');
          url.should.equal('/v1/projects/1/forms');
          data.should.be.an.instanceof(File);
          data.name.should.equal('my_form.xlsx');
          // We test request headers separately below.
        })
        .respondWithProblem();
    });

    it('sends the correct request when uploading a new definition', () => {
      testData.extendedForms.createPast(1, { draft: true });
      return mockHttp()
        .mount(FormNew, mountOptions())
        .request(upload)
        .beforeEachResponse((_, { method, url, data }) => {
          method.should.equal('POST');
          url.should.equal('/v1/projects/1/forms/f/draft');
          data.should.be.an.instanceof(File);
          data.name.should.equal('my_form.xlsx');
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
        const dropZone = modal.getComponent(FileDropZone);
        dropZone.props().disabled.should.be.true;
        const button = dropZone.get('.btn-primary');
        button.attributes('aria-disabled').should.equal('true');
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
        app.get('#page-head-title').text().should.equal('Form 2');
      }));

    it('shows a success alert', () =>
      createForm().then(app => {
        app.should.alert('success', '“Form 2” has been created as a Form Draft.');
      }));

    it('increments the form count', () =>
      createForm()
        .complete()
        .load('/projects/1', { project: false })
        .beforeAnyResponse(app => {
          // The form count should be seen to be incremented even before the
          // updated form list is received.
          app.get('#page-head-tabs li.active .badge').text().should.equal('2');
        }));
  });

  describe('after uploading a new definition', () => {
    beforeEach(mockLogin);

    it('hides the modal', () => {
      testData.extendedForms.createPast(1, { draft: true });
      return load('/projects/1/forms/f/draft')
        .complete()
        .request(async (app) => {
          await app.get('#form-edit-upload-button').trigger('click');
          return upload(app);
        })
        .respondWithData(() => {
          testData.extendedFormVersions.createNew({
            version: 'v2',
            draft: true
          });
          return { success: true };
        })
        .respondForComponent('FormEdit')
        .afterResponses(app => {
          app.getComponent(FormNew).props().state.should.be.false;
        });
    });

    it('shows a success alert', () => {
      testData.extendedForms.createPast(1, { draft: true });
      return load('/projects/1/forms/f/draft')
        .complete()
        .request(async (app) => {
          await app.get('#form-edit-upload-button').trigger('click');
          return upload(app);
        })
        .respondWithData(() => {
          testData.extendedFormVersions.createNew({
            version: 'v2',
            draft: true
          });
          return { success: true };
        })
        .respondForComponent('FormEdit')
        .afterResponses(app => {
          app.should.alert('success', 'The new Form definition has been saved as your Draft.');
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
          await app.get('#form-edit-upload-button').trigger('click');
          return upload(app);
        })
        .respondWithData(() => {
          testData.extendedFormVersions.createNew({
            version: 'v2',
            draft: true
          });
          return { success: true };
        })
        .respondForComponent('FormEdit')
        .afterResponses(app => {
          const { version } = app.getComponent(FormVersionString).props();
          version.should.equal('v2');
        });
    });

    it('updates the list of attachments', () => {
      testData.extendedForms.createPast(1, { draft: true });
      testData.standardFormAttachments.createPast(1, { blobExists: false });
      return load('/projects/1/forms/f/draft')
        .afterResponses(app => {
          app.findAll('.form-attachment-row').length.should.equal(1);
        })
        .request(async (app) => {
          await app.get('#form-edit-upload-button').trigger('click');
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
        .respondForComponent('FormEdit')
        .afterResponses(app => {
          app.findAll('.form-attachment-row').length.should.equal(2);
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

    it('shows a message for duplicate entity property', () => {
      testData.extendedForms.createPast(1);
      return mockHttp()
        .mount(FormNew, mountOptions())
        .request(upload)
        .respondWithProblem({
          code: 409.17,
          message: 'This Form attempts to create new Entity properties that match with existing ones except for capitalization.',
          details: { duplicateProperties: [{ current: 'first_name', provided: 'FIRST_NAME' }] }
        })
        .afterResponse(modal => {
          modal.should.alert(
            'danger',
            /This Form attempts to create a new Entity property that matches with an existing one except for capitalization:.*FIRST_NAME \(existing: first_name\)/s
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
        warnings: {
          xlsFormWarnings: ['warning 1', 'warning 2'],
          workflowWarnings: [
            { type: 'structureChanged', details: ['Name', 'Age'] },
            { type: 'deletedFormExists', details: { xmlFormId: 'simple' } },
            { type: 'oldEntityVersion', details: { version: '2022.1.0' } }
          ]
        }
      }
    };

    it('shows only xls warnings', () => {
      testData.extendedProjects.createPast(1);
      const xlsWarnings = clone(xlsFormWarning);
      delete xlsWarnings.details.warnings.workflowWarnings;

      return mockHttp()
        .mount(FormNew, mountOptions())
        .request(upload)
        .respondWithProblem(xlsWarnings)
        .afterResponse(modal => {
          const warnings = modal.get('.modal-warnings');
          warnings.should.be.visible();
          const text = warnings.findAll('li').map(li => li.text());
          text.should.eql(['warning 1', 'warning 2']);
        });
    });

    it('shows only workflow warnings', () => {
      testData.extendedProjects.createPast(1);
      const workflowWarnings = clone(xlsFormWarning);
      delete workflowWarnings.details.warnings.xlsFormWarnings;

      return mockHttp()
        .mount(FormNew, mountOptions())
        .request(upload)
        .respondWithProblem(workflowWarnings)
        .afterResponse(modal => {
          const warnings = modal.get('.modal-warnings');
          warnings.should.be.visible();
          const items = warnings.findAll('li');
          items[0].text().should.startWith('The following fields have been');
          items[0].get('span').text().should.eql('Fields: Name, Age');

          items[1].text().should.startWith('There is a form with ID "simple" in the Trash');
          items[1].find('span').exists().should.be.false;

          items[2].text().should.startWith('Entities specification version “2022.1.0” is not compatible with Offline Entities');
          items[2].find('span').exists().should.be.false;
        });
    });

    it('shows xls and workflow warnings', () => {
      testData.extendedProjects.createPast(1);
      return mockHttp()
        .mount(FormNew, mountOptions())
        .request(upload)
        .respondWithProblem(xlsFormWarning)
        .afterResponse(modal => {
          const warnings = modal.get('.modal-warnings');
          warnings.should.be.visible();
          const items = warnings.findAll('li');

          items[0].text().should.eql('warning 1');
          items[1].text().should.eql('warning 2');

          items[2].text().should.startWith('The following fields have been');
          items[2].get('span').text().should.eql('Fields: Name, Age');

          items[3].text().should.startWith('There is a form with ID "simple" in the Trash');
          items[3].find('span').exists().should.be.false;

          items[4].text().should.startWith('Entities specification version “2022.1.0” is not compatible with Offline Entities');
          items[4].find('span').exists().should.be.false;
        });
    });

    it('shows create hyperlink for learn more in xls warnings', () => {
      testData.extendedProjects.createPast(1);
      const xlsWarnings = clone(xlsFormWarning);
      delete xlsWarnings.details.warnings.workflowWarnings;
      xlsWarnings.details.warnings.xlsFormWarnings[0] += '. Learn more: https://xlsform.org/en/#image';
      xlsWarnings.details.warnings.xlsFormWarnings[1] += '. Learn more: https://xlsform.org#multiple-language-support';

      return mockHttp()
        .mount(FormNew, mountOptions())
        .request(upload)
        .respondWithProblem(xlsWarnings)
        .afterResponse(modal => {
          const warnings = modal.get('.modal-warnings');
          warnings.should.be.visible();
          const items = warnings.findAll('li');
          items[0].element.childNodes[0].nodeValue.should.eql('warning 1. ');
          items[0].find('a').attributes('href').should.eql('https://xlsform.org/en/#image');
          items[0].find('a').text().should.eql('Learn more.');

          items[1].element.childNodes[0].nodeValue.should.eql('warning 2. ');
          items[1].find('a').attributes('href').should.eql('https://xlsform.org#multiple-language-support');
          items[1].find('a').text().should.eql('Learn more.');
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
            const text = component.findAll('.modal-warnings p')[3].text();
            text.should.include('create the Form');
          });
      });

      it('shows the correct text when uploading a new definition', () => {
        testData.extendedForms.createPast(1, { draft: true });
        return mockHttp()
          .mount(FormNew, mountOptions())
          .request(upload)
          .respondWithProblem(xlsFormWarning)
          .afterResponse(component => {
            const text = component.findAll('.modal-warnings p')[3].text();
            text.should.include('update the Draft');
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

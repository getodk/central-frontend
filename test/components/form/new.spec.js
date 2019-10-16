import FormNew from '../../../src/components/form/new.vue';
import testData from '../../data';
import { dataTransfer, trigger } from '../../event';
import { mockHttp, mockRoute } from '../../http';
import { mockLogin } from '../../session';
import { mountAndMark } from '../../destroy';

const XML_FILENAME = 'test.xml';
const XML = '<a><b/></a>';

const file = () => new File([XML], XML_FILENAME);
const selectFileByInput = (modal) => {
  const input = modal.first('input[type="file"]');
  const target = { files: dataTransfer([file()]).files };
  const event = $.Event('change', { target });
  $(input.element).trigger(event);
  return modal.vm.$nextTick().then(() => modal);
};
const dragAndDrop = (modal) =>
  trigger.dragAndDrop(modal, '#form-new-drop-zone', [file()]);
const waitForRead = (modal) => {
  if (modal.data().filename != null)
    return modal.vm.$nextTick().then(() => modal);
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(waitForRead(modal));
    });
  });
};

const FILE_SELECTION_METHODS = [
  [selectFileByInput, 'file input'],
  [dragAndDrop, 'drag and drop']
];

describe('FormNew', () => {
  beforeEach(mockLogin);

  describe('New button', () => {
    it('shows the button for a project that is not archived', () =>
      mockRoute('/projects/1')
        .respondWithData(() => testData.extendedProjects.createPast(1).last())
        .respondWithData(() => testData.extendedForms.sorted())
        .afterResponses(app => {
          app.find('#project-overview-new-form-button').length.should.equal(1);
        }));

    it('does not show the button for an archived project', () =>
      mockRoute('/projects/1')
        .respondWithData(() =>
          testData.extendedProjects.createPast(1, { archived: true }).last())
        .respondWithData(() => testData.extendedForms.sorted())
        .afterResponses(app => {
          app.find('#project-overview-new-form-button').length.should.equal(0);
        }));
  });

  it('shows the modal after the New button is clicked', () =>
    mockRoute('/projects/1')
      .respondWithData(() => testData.extendedProjects.createPast(1).last())
      .respondWithData(() => testData.extendedForms.createPast(1).sorted())
      .afterResponses(app => {
        app.first(FormNew).getProp('state').should.be.false();
        return app;
      })
      .then(app => trigger.click(app, '#project-overview-new-form-button'))
      .then(app => {
        app.first(FormNew).getProp('state').should.be.true();
      }));

  it('shows an info alert if no file is selected', () => {
    const modal = mountAndMark(FormNew, {
      propsData: { state: true, projectId: '1' }
    });
    modal.should.not.alert();
    return trigger.click(modal, '#form-new-create-button')
      .then(() => {
        modal.should.alert('info');
      });
  });

  for (const [selectFile, title] of FILE_SELECTION_METHODS) {
    describe(title, () => {
      it('disables the Create button while reading the file', () => {
        const modal = mountAndMark(FormNew, {
          propsData: { state: true, projectId: '1' }
        });
        return selectFile(modal)
          .then(() => {
            modal.data().reading.should.be.true();
            modal.first('#form-new-create-button').should.be.disabled();
          })
          .then(() => waitForRead(modal));
      });

      it('updates the modal after reading the file', () => {
        const modal = mountAndMark(FormNew, {
          propsData: { state: true, projectId: '1' }
        });
        return selectFile(modal)
          .then(waitForRead)
          .then(() => {
            modal.data().reading.should.be.false();
            modal.data().filename.should.equal(XML_FILENAME);
            modal.data().xml.should.equal(XML);
            modal.first('#form-new-create-button').should.not.be.disabled();
          });
      });

      it('implements some standard button things', () =>
        mockHttp()
          .mount(FormNew, {
            propsData: { state: true, projectId: '1' }
          })
          .request(modal => selectFile(modal)
            .then(waitForRead)
            .then(() => trigger.click(modal, '#form-new-create-button')))
          .standardButton('#form-new-create-button'));

      describe('after a successful submit', () => {
        let app;
        beforeEach(() => mockRoute('/projects/1')
          .respondWithData(() => testData.extendedProjects.createPast(1).last())
          .respondWithData(() => testData.extendedForms.createPast(1).sorted())
          .afterResponse(component => {
            app = component;
          })
          .request(() => trigger.click(app, '#project-overview-new-form-button')
            .then(() => selectFile(app.first(FormNew)))
            .then(waitForRead)
            .then(() => trigger.click(app, '#form-new-create-button')))
          .respondWithData(() => testData.simpleForms
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
        it('shows a message for a projectId,xmlFormId duplicate', () =>
          mockHttp()
            .mount(FormNew, {
              propsData: { state: true, projectId: '1' }
            })
            .request(modal => selectFile(modal)
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
              propsData: { state: true, projectId: '1' }
            })
            .request(modal => selectFile(modal)
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
    });
  }
});

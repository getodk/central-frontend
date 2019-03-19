import FormNew from '../../../lib/components/form/new.vue';
import testData from '../../data';
import { dataTransfer, trigger } from '../../event';
import { mockHttp, mockRoute } from '../../http';
import { mockLogin } from '../../session';
import { mountAndMark } from '../../destroy';

const XML_FILENAME = 'test.xml';
const XML = '<a><b/></a>';

const findModal = (wrapper) => wrapper.first(FormNew);
const openModal = (wrapper) => trigger
  .click(wrapper, '#project-overview-new-form-button')
  .then(() => findModal(wrapper));
const propsData = () => ({
  propsData: {
    projectId: '1'
  }
});
const createForm = (modal) => {
  testData.extendedForms.createNew();
  return modal;
};
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
  return new Promise(resolve =>
    setTimeout(() => resolve(waitForRead(modal)), 0));
};
const clickCreateButtonInModal = (modal) =>
  trigger.click(modal.first('#form-new-create-button')).then(() => modal);

const FILE_SELECTION_METHODS = [
  [selectFileByInput, 'file input'],
  [dragAndDrop, 'drag and drop']
];

describe('FormNew', () => {
  beforeEach(mockLogin);

  describe('modal', () => {
    it('is initially hidden', () =>
      mockRoute('/projects/1')
        .respondWithData(() => testData.extendedProjects.createPast(1).last())
        .respondWithData(() => testData.extendedForms.createPast(1).sorted())
        .then(findModal)
        .then(modal => {
          modal.getProp('state').should.be.false();
        }));

    it('is shown after button click', () =>
      mockRoute('/projects/1')
        .respondWithData(() => testData.extendedProjects.createPast(1).last())
        .respondWithData(() => testData.extendedForms.createPast(1).sorted())
        .then(openModal)
        .then(modal => {
          modal.getProp('state').should.be.true();
        }));
  });

  describe('no file selection', () => {
    let modal;
    beforeEach(() => {
      modal = mountAndMark(FormNew, propsData());
    });

    it('initially shows no alert', () => {
      modal.should.not.alert();
    });

    it('shows info message upon button click', () =>
      clickCreateButtonInModal(modal).then(() => modal.should.alert('info')));
  });

  for (const [selectFile, title] of FILE_SELECTION_METHODS) {
    describe(title, () => {
      it('disables the create button during file read', () =>
        Promise.resolve(mountAndMark(FormNew, propsData()))
          .then(createForm)
          .then(selectFile)
          .then(modal => {
            modal.data().reading.should.be.true();
            const button = modal.first('#form-new-create-button');
            button.getAttribute('disabled').should.be.ok();
            return modal;
          })
          .then(waitForRead));

      it('modal is updated after file read', () =>
        Promise.resolve(mountAndMark(FormNew, propsData()))
          .then(createForm)
          .then(selectFile)
          .then(waitForRead)
          .then(modal => {
            modal.data().reading.should.be.false();
            modal.data().filename.should.equal(XML_FILENAME);
            modal.data().xml.should.equal(XML);
            const button = modal.first('#form-new-create-button');
            button.element.disabled.should.be.false();
          }));

      it('standard button thinking things', () =>
        mockHttp()
          .mount(FormNew, propsData())
          .request(modal => Promise.resolve(modal)
            .then(createForm)
            .then(selectFile)
            .then(waitForRead)
            .then(clickCreateButtonInModal))
          .standardButton('#form-new-create-button'));

      describe('after successful submit', () => {
        let app;
        beforeEach(() => mockRoute('/projects/1')
          .respondWithData(() => testData.extendedProjects.createPast(1).last())
          .respondWithData(() => testData.extendedForms.createPast(1).sorted())
          .afterResponse(component => {
            app = component;
            testData.extendedForms.createNew({ name: 'xyz', submissions: 0 });
          })
          .request(() => openModal(app)
            .then(selectFile)
            .then(waitForRead)
            .then(clickCreateButtonInModal))
          .respondWithData(() => testData.simpleForms.last()) // FormNew
          .respondWithData(() => testData.extendedForms.last()) // FormShow
          .respondWithData(() => testData.extendedFormAttachments.sorted()));

        it('redirects to the form overview', () => {
          const form = testData.extendedForms.last();
          const encodedFormId = encodeURIComponent(form.xmlFormId);
          app.vm.$route.path.should.equal(`/projects/1/forms/${encodedFormId}`);
        });

        it('shows form name', () => {
          const form = testData.extendedForms.last();
          app.first('#page-head-title').text().trim().should.equal(form.name);
        });

        it('shows success message', () => {
          app.should.alert('success');
        });

        describe('after navigating back to the project overview', () => {
          beforeEach(() => mockHttp()
            .route('/projects/1')
            .respondWithData(() => testData.extendedForms.sorted()));

          it('table has the correct number of rows', () => {
            app.find('#form-list-table tbody tr').length.should.equal(2);
          });
        });
      });

      it('shows a custom error message for a 400.5 problem', () =>
        mockHttp()
          .mount(FormNew, propsData())
          .request(modal => Promise.resolve(modal)
            .then(createForm)
            .then(selectFile)
            .then(waitForRead)
            .then(clickCreateButtonInModal))
          .respondWithProblem(() => ({
            code: 400.5,
            message: 'Error',
            details: {
              table: 'forms',
              fields: [
                'xmlFormId',
                'version'
              ],
              values: [
                testData.extendedForms.last().xmlFormId,
                testData.extendedForms.last().version
              ]
            }
          }))
          .afterResponse(modal => {
            modal.should.alert('danger', 'A Form previously existed which had the same formId and version as the one you are attempting to create now. To prevent confusion, please change one or both and try creating the Form again.');
          }));
    });
  }
});

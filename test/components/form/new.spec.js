/*
Copyright 2017 Super Adventure Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/nafundi/super-adventure/blob/master/NOTICE.

This file is part of Super Adventure. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of Super Adventure,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import FormNew from '../../../lib/components/form/new.vue';
import testData from '../../data';
import { mockHttp, mockRoute } from '../../http';
import { mockLogin } from '../../session';
import { mountAndMark } from '../../destroy';
import { trigger } from '../../util';

const XML_FILENAME = 'test.xml';

const findModal = (wrapper) => wrapper.first(FormNew);
const openModal = (wrapper) => trigger
  .click(wrapper.first('#form-list-new-button'))
  .then(() => findModal(wrapper));
const createForm = (modal) => {
  testData.extendedForms.createNew();
  return modal;
};
const dataTransfer = () => {
  const dt = new DataTransfer();
  const file = new File([testData.extendedForms.last().xml], XML_FILENAME);
  dt.items.add(file);
  return dt;
};
const selectFileByInput = (modal) => {
  const input = modal.first('input[type="file"]');
  const target = { files: dataTransfer().files };
  const event = $.Event('change', { target });
  $(input.element).trigger(event);
  return modal.vm.$nextTick().then(() => modal);
};
const triggerDragEvent = (type) => (modal) => {
  const originalEvent = $.Event(type, { dataTransfer: dataTransfer() });
  const event = $.Event(type, { originalEvent });
  $(modal.vm.$refs.dropZone).trigger(event);
  return modal.vm.$nextTick().then(() => modal);
};
const dragover = triggerDragEvent('dragover');
const drop = triggerDragEvent('drop');
const dragAndDrop = (modal) => dragover(modal).then(drop);
const waitForRead = (modal) => {
  if (modal.data().filename !== '')
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
      // Mocking the route, because the table uses <router-link>.
      mockRoute('/forms')
        .respondWithData(() => testData.extendedForms.createPast(1).sorted())
        .then(findModal)
        .then(modal => modal.getProp('state').should.be.false()));

    it('is shown after button click', () =>
      mockRoute('/forms')
        .respondWithData(() => testData.extendedForms.createPast(1).sorted())
        .then(openModal)
        .then(modal => modal.getProp('state').should.be.true()));
  });

  describe('no file selection', () => {
    let modal;
    beforeEach(() => {
      modal = mountAndMark(FormNew);
    });

    it('initially shows no alert', () => {
      modal.should.not.alert();
    });

    it('shows info message upon button click', () =>
      clickCreateButtonInModal(modal).then(() => modal.should.alert('info')));
  });

  for (const [selectFile, title] of FILE_SELECTION_METHODS) {
    describe(title, () => {
      it('clicking create button during file read shows info message', () =>
        Promise.resolve(mountAndMark(FormNew))
          .then(createForm)
          .then(selectFile)
          .then(clickCreateButtonInModal)
          .then(modal => {
            modal.data().reading.should.be.true();
            modal.should.alert('info');
          }));

      it('modal is updated after file read', () =>
        Promise.resolve(mountAndMark(FormNew))
          .then(createForm)
          .then(selectFile)
          .then(waitForRead)
          .then(modal => {
            modal.data().reading.should.be.false();
            modal.data().filename.should.equal(XML_FILENAME);
            modal.data().xml.should.equal(testData.extendedForms.last().xml);
          }));

      it('standard button thinking things', () =>
        mockHttp()
          .mount(FormNew)
          .request(modal => Promise.resolve(modal)
            .then(createForm)
            .then(selectFile)
            .then(waitForRead)
            .then(clickCreateButtonInModal))
          .standardButton('#form-new-create-button'));

      describe('after successful submit', () => {
        let app;
        let form;
        beforeEach(() => mockRoute('/forms')
          .respondWithData(() => testData.extendedForms.createPast(1).sorted())
          .afterResponse(component => {
            app = component;
            form = testData.extendedForms.createNew('withName');
          })
          .request(() => openModal(app)
            .then(selectFile)
            .then(waitForRead)
            .then(clickCreateButtonInModal))
          .respondWithData(() => testData.simpleForms.last()) // FormNew request
          .respondWithData(() => testData.simpleForms.last()) // FormShow request
          .respondWithData(() => [])); // FormSubmissions request

        it('redirects to submissions list', () => {
          app.vm.$route.path.should.equal(`/forms/${form.xmlFormId}/submissions`);
        });

        it('shows form name', () => {
          app.first('#page-head h1').text().trim().should.equal(form.name);
        });

        it('shows success message', () => {
          app.should.alert('success');
        });

        describe('after navigating back to forms list', () => {
          beforeEach(() => mockHttp()
            .request(() => app.vm.$router.push('/forms'))
            .respondWithData(() => testData.extendedForms.sorted()));

          it('table has the correct number of rows', () => {
            app.find('#form-list-table tbody tr').length.should.equal(2);
          });
        });
      });
    });
  }
});

import pako from 'pako';

import Form from '../../../lib/presenters/form';
import FormAttachment from '../../../lib/presenters/form-attachment';
import FormAttachmentList from '../../../lib/components/form-attachment/list.vue';
import FormAttachmentNameMismatch from '../../../lib/components/form-attachment/name-mismatch.vue';
import FormAttachmentUploadFiles from '../../../lib/components/form-attachment/upload-files.vue';
import testData from '../../data';
import { dataTransfer, trigger } from '../../event';
import { formatDate } from '../../../lib/util/util';
import { mockHttp, mockRoute } from '../../http';
import { mockLogin, mockRouteThroughLogin } from '../../session';

const loadAttachments = ({ route = false, attachToDocument = false } = {}) => {
  // It is expected that test data is created before loadAttachments() is
  // called.
  testData.extendedProjects.size.should.equal(1);
  testData.extendedForms.size.should.equal(1);
  testData.extendedFormAttachments.size.should.not.equal(0);

  const form = testData.extendedForms.last();
  if (route) {
    const encodedFormId = encodeURIComponent(form.xmlFormId);
    const path = `/projects/1/forms/${encodedFormId}/media-files`;
    return mockRoute(path, { attachToDocument })
      .respondWithData(() => testData.extendedProjects.last())
      .respondWithData(() => form)
      .respondWithData(() => testData.extendedFormAttachments.sorted());
  }
  if (attachToDocument) throw new Error('invalid options');
  return mockHttp()
    .mount(FormAttachmentList, {
      propsData: { projectId: '1' },
      requestData: {
        form: new Form(form),
        attachments: testData.extendedFormAttachments.sorted()
          .map(attachment => new FormAttachment(attachment))
      }
    });
};
const blankFiles = (names) => names.map(name => new File([''], name));
const selectFilesUsingModal = (app, files) =>
  trigger.click(app, '#form-attachment-list-heading button')
    .then(() =>
      trigger.click(app, '#form-attachment-upload-files a[role="button"]'))
    .then(() => {
      const input = app.first('#form-attachment-upload-files input[type="file"]');
      const target = { files: dataTransfer(files).files };
      const event = $.Event('change', { target });
      $(input.element).trigger(event);
      return app.vm.$nextTick();
    })
    .then(() => app);

describe('FormAttachmentList', () => {
  describe('routing', () => {
    it('redirects an anonymous user to login', () =>
      mockRoute('/projects/1/forms/x/media-files')
        .restoreSession(false)
        .afterResponse(app => {
          app.vm.$route.path.should.equal('/login');
        }));

    it('redirects the user back after login', () =>
      mockRouteThroughLogin('/projects/1/forms/x/media-files')
        .respondWithData(() => testData.extendedProjects.createPast(1).last())
        .respondWithData(() =>
          testData.extendedForms.createPast(1, { xmlFormId: 'x' }).last())
        .respondWithData(() =>
          testData.extendedFormAttachments.createPast(1).sorted())
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/projects/1/forms/x/media-files');
        }));
  });

  describe('Media Files tab', () => {
    beforeEach(mockLogin);

    it('is not shown if there are no form attachments', () =>
      mockRoute('/projects/1/forms/x')
        .respondWithData(() => testData.extendedProjects.createPast(1).last())
        .respondWithData(() =>
          testData.extendedForms.createPast(1, { xmlFormId: 'x' }).last())
        .respondWithData(() => testData.extendedFormAttachments.sorted())
        .afterResponses(app => {
          const tabs = app.find('#page-head .nav-tabs li a')
            .map(a => a.text());
          tabs.should.eql(['Overview', 'Submissions', 'Settings']);
        }));

    it('is shown if there are form attachments', () =>
      mockRoute('/projects/1/forms/x')
        .respondWithData(() => testData.extendedProjects.createPast(1).last())
        .respondWithData(() =>
          testData.extendedForms.createPast(1, { xmlFormId: 'x' }).last())
        .respondWithData(() => testData.extendedFormAttachments
          .createPast(1, { exists: false })
          .sorted())
        .afterResponses(app => {
          const tabs = app.find('#page-head .nav-tabs li a')
            .map(a => a.text().trim().iTrim());
          tabs.should.eql(['Overview', 'Media Files 1', 'Submissions', 'Settings']);
        }));

    describe('badge', () => {
      it('is correct when all files are missing', () => {
        testData.extendedFormAttachments.createPast(2, { exists: false });
        return loadAttachments({ route: true }).then(app => {
          const badge = app.first('#page-head .nav-tabs .badge');
          badge.text().trim().should.equal('2');
        });
      });

      it('is correct when some files are missing', () => {
        testData.extendedFormAttachments
          .createPast(2, { exists: true })
          .createPast(1, { exists: false });
        return loadAttachments({ route: true }).then(app => {
          const badge = app.first('#page-head .nav-tabs .badge');
          badge.text().trim().should.equal('1');
        });
      });

      it('is not shown when all files exist', () => {
        testData.extendedFormAttachments.createPast(2, { exists: true });
        return loadAttachments({ route: true }).then(app => {
          app.first('#page-head .nav-tabs .badge').should.be.hidden();
        });
      });
    });
  });

  describe('table', () => {
    beforeEach(mockLogin);

    it('correctly sorts the table', () => {
      const attachments = testData.extendedFormAttachments
        .createPast(1, { exists: true })
        .createPast(1, { exists: false })
        .sorted();
      return loadAttachments().then(component => {
        const tr = component.find('#form-attachment-list-table tbody tr');
        tr.length.should.equal(attachments.length);
        for (let i = 0; i < tr.length; i += 1) {
          const td = tr[i].find('td');
          const attachment = attachments[i];
          td[1].text().trim().should.equal(attachment.name);
        }
      });
    });

    describe('attachment type', () => {
      const cases = [
        ['image', 'Image'],
        ['video', 'Video'],
        ['audio', 'Audio'],
        ['file', 'Data File'],
        ['not_a_type', 'not_a_type']
      ];
      for (const [type, displayName] of cases) {
        it(`is correct for ${type}`, () => {
          testData.extendedFormAttachments.createPast(1, { type });
          return loadAttachments().then(component => {
            const td = component.first('#form-attachment-list-table tbody td');
            td.text().trim().should.equal(displayName);
          });
        });
      }
    });

    it('adds a title attribute for the attachment name', () => {
      testData.extendedFormAttachments.createPast(1);
      return loadAttachments().then(component => component
        .first('#form-attachment-list-table tbody tr')
        .find('td')[1]
        .getAttribute('title')
        .should.equal(testData.extendedFormAttachments.last().name));
    });

    it('shows a download link if the attachment exists', () => {
      testData.extendedFormAttachments.createPast(1, { exists: true });
      return loadAttachments().then(component => {
        const $a = $(component.vm.$el)
          .find('#form-attachment-list-table tbody td')
          .eq(1)
          .find('a');
        $a.prop('tagName').should.equal('A');
        const form = testData.extendedForms.last();
        const encodedFormId = encodeURIComponent(form.xmlFormId);
        const { name } = testData.extendedFormAttachments.last();
        const encodedName = encodeURIComponent(name);
        $a.attr('href').should.equal(`/v1/projects/1/forms/${encodedFormId}/attachments/${encodedName}`);
      });
    });

    describe('updatedAt', () => {
      it('formats updatedAt for an existing attachments', () => {
        testData.extendedFormAttachments.createPast(1, { exists: true });
        return loadAttachments().then(component => {
          const td = component.find('#form-attachment-list-table tbody td')[2];
          const text = td.text().trim().iTrim();
          const { updatedAt } = testData.extendedFormAttachments.last();
          text.should.equal(`${formatDate(updatedAt)} Replace`);
          // Check that "Replace" is hidden.
          td.first('span').should.be.hidden();
        });
      });

      it('correctly renders an attachment that has never been uploaded', () => {
        testData.extendedFormAttachments
          .createPast(1, { exists: false, hasUpdatedAt: false });
        return loadAttachments().then(component => {
          const span = component
            .find('#form-attachment-list-table tbody td')[2]
            .find('span');
          span.length.should.equal(2);
          span[0].hasClass('icon-exclamation-triangle').should.be.true();
          span[1].getAttribute('title').should.containEql('To upload files,');
          span[1].text().trim().should.equal('Not yet uploaded');
        });
      });

      it('correctly renders a deleted attachment', () => {
        testData.extendedFormAttachments
          .createPast(1, { exists: false, hasUpdatedAt: true });
        return loadAttachments().then(component => {
          const span = component
            .find('#form-attachment-list-table tbody td')[2]
            .find('span');
          span.length.should.equal(2);
          span[0].hasClass('icon-exclamation-triangle').should.be.true();
          span[1].getAttribute('title').should.containEql('To upload files,');
          span[1].text().trim().should.equal('Not yet uploaded');
        });
      });
    });
  });

  /*
  testMultipleFileSelection() tests the effects of selecting multiple files to
  upload. It does not test the effects of actually uploading those files: that
  comes later. However, it tests everything between selecting the files and
  uploading them.

  The tests will be run under three different scenarios:

    1. The user drops multiple files over the page as if under IE.
    2. The user drops multiple files over the page normally (not as if under
       IE).
    3. The user selects multiple files using the file input.

  For each scenario, the function is passed a callback (`select`) that selects
  the files.

  The user must be logged in before these tests.
  */
  const testMultipleFileSelection = (select) => {
    describe('table', () => {
      let app;
      beforeEach(() => {
        testData.extendedFormAttachments
          .createPast(1, { name: 'a', exists: true })
          .createPast(1, { name: 'b', exists: false })
          .createPast(1, { name: 'c' });
        return loadAttachments({ route: true })
          .then(component => {
            app = component;
          })
          .then(() => select(app, blankFiles(['a', 'b', 'd'])));
      });

      it('highlights only matching rows', () => {
        const targeted = app.find('#form-attachment-list-table tbody tr')
          .map(tr => tr.hasClass('form-attachment-row-targeted'));
        targeted.should.eql([true, true, false]);
      });

      it('shows a Replace label for the correct row', () => {
        const tr = app.find('#form-attachment-list-table tbody tr');
        tr[0].first('.label').should.be.visible();
        tr[1].find('.label').length.should.equal(0);
        // The label of the third row should either not exist or be hidden.
        const label = tr[2].find('.label');
        if (label.length !== 0) label[0].should.be.hidden();
      });
    });

    describe('after the uploads are canceled', () => {
      let app;
      beforeEach(() => {
        testData.extendedFormAttachments
          .createPast(1, { name: 'a', exists: true })
          .createPast(1, { name: 'b', exists: false })
          .createPast(1, { name: 'c' });
        return loadAttachments({ route: true })
          .then(component => {
            app = component;
          })
          .then(() => select(app, blankFiles(['a', 'b', 'd'])))
          .then(() =>
            trigger.click(app, '#form-attachment-popups-main .btn-link'));
      });

      it('unhighlights the rows', () => {
        app.find('.form-attachment-row-targeted').should.be.empty();
      });

      it('hides the popup', () => {
        app.first('#form-attachment-popups-main').should.be.hidden();
      });
    });

    describe('unmatched files', () => {
      beforeEach(() => {
        testData.extendedFormAttachments
          .createPast(1, { name: 'a' })
          .createPast(1, { name: 'b' })
          .createPast(1, { name: 'c' });
      });

      it('renders correctly if there are no unmatched files', () =>
        loadAttachments({ route: true, attachToDocument: true })
          .then(app => select(app, blankFiles(['a', 'b'])))
          .then(app => {
            const popup = app.first('#form-attachment-popups-main');
            popup.should.be.visible();
            const popupText = popup.first('p').text().trim().iTrim();
            popupText.should.equal('2 files ready for upload.');
            popup.first('#form-attachment-popups-unmatched').should.be.hidden();
            popup.first('.btn-primary').should.be.focused();
          }));

      it('renders correctly if there is one unmatched file', () =>
        loadAttachments({ route: true, attachToDocument: true })
          .then(app => select(app, blankFiles(['a', 'd'])))
          .then(app => {
            const popup = app.first('#form-attachment-popups-main');
            popup.should.be.visible();
            const popupText = popup.first('p').text().trim().iTrim();
            popupText.should.equal('1 file ready for upload.');
            const unmatched = popup.first('#form-attachment-popups-unmatched');
            unmatched.should.be.visible();
            unmatched.first('.icon-exclamation-triangle');
            const unmatchedText = unmatched.text().trim().iTrim();
            unmatchedText.should.containEql('1 file has a name we don’t recognize and will be ignored.');
            popup.first('.btn-primary').should.be.focused();
          }));

      it('renders correctly if there are multiple unmatched files', () =>
        loadAttachments({ route: true, attachToDocument: true })
          .then(app => select(app, blankFiles(['a', 'd', 'e'])))
          .then(app => {
            const popup = app.first('#form-attachment-popups-main');
            popup.should.be.visible();
            const popupText = popup.first('p').text().trim().iTrim();
            popupText.should.equal('1 file ready for upload.');
            const unmatched = popup.first('#form-attachment-popups-unmatched');
            unmatched.should.be.visible();
            unmatched.first('.icon-exclamation-triangle');
            const unmatchedText = unmatched.text().trim().iTrim();
            unmatchedText.should.containEql('2 files have a name we don’t recognize and will be ignored.');
            popup.first('.btn-primary').should.be.focused();
          }));

      it('renders correctly if all files are unmatched', () =>
        loadAttachments({ route: true, attachToDocument: true })
          .then(app => select(app, blankFiles(['d', 'e'])))
          .then(app => {
            const popup = app.first('#form-attachment-popups-main');
            popup.should.be.visible();
            const popupText = popup.first('p').text().trim().iTrim();
            popupText.should.containEql('We don’t recognize any of the files you are trying to upload.');
            popup.find('#form-attachment-popups-unmatched').should.be.empty();
            popup.first('.btn-primary').should.be.focused();
          }));

      it('allows the user to close the popup if all files are unmatched', () =>
        loadAttachments({ route: true })
          .then(app => select(app, blankFiles(['d', 'e'])))
          .then(app => {
            const popup = app.first('#form-attachment-popups-main');
            popup.element.style.display.should.equal('');
            return trigger.click(popup, '.btn-primary');
          })
          .then(popup => {
            popup.element.style.display.should.equal('none');
          }));
    });
  };

  /*
  testSingleFileSelection() tests the effects of selecting a single file to
  upload. It does not test the effects of actually uploading the file: that
  comes later. However, it tests everything between selecting the file and
  uploading it.

  The tests will be run under three different scenarios:

    1. The user drops a single file outside a row of the table as if under IE
       (where countOfFilesOverDropZone === -1).
    2. The user drops a single file outside a row of the table normally
       (where countOfFilesOverDropZone === 1).
    3. The user selects a single file using the file input.

  The tests are not run under the following scenario, which differs in a few
  ways:

    - The user drops a single file over an attachment.

  For each scenario, the function is passed a callback (`select`) that selects
  the file.

  The user must be logged in before these tests.
  */
  const testSingleFileSelection = (select) => {
    const loadAndSelect = (filename, options = {}) =>
      loadAttachments({ ...options, route: true })
        .then(app => select(app, blankFiles([filename])));

    describe('after a selection', () => {
      beforeEach(() => {
        testData.extendedFormAttachments
          .createPast(1, { name: 'a', exists: true })
          .createPast(1, { name: 'b', exists: false })
          .createPast(1, { name: 'c', exists: true })
          .createPast(1, { name: 'd', exists: false });
      });

      it('highlights only the matching row', () =>
        loadAndSelect('a').then(app => {
          const targeted = app.find('#form-attachment-list-table tbody tr')
            .map(tr => tr.hasClass('form-attachment-row-targeted'));
          targeted.should.eql([true, false, false, false]);
        }));

      describe('Replace label', () => {
        it('shows the label when the file matches an existing attachment', () =>
          loadAndSelect('a').then(app => {
            const tr = app.find('#form-attachment-list-table tbody tr');
            tr[0].first('.label').should.be.visible();
            tr[1].find('.label').length.should.equal(0);
            tr[2].first('.label').should.be.hidden();
            tr[3].find('.label').length.should.equal(0);
          }));

        it('does not show the label when the file matches a missing attachment', () =>
          loadAndSelect('b').then(app => {
            const tr = app.find('#form-attachment-list-table tbody tr');
            tr[0].first('.label').should.be.hidden();
            tr[1].find('.label').length.should.equal(0);
            tr[2].first('.label').should.be.hidden();
            tr[3].find('.label').length.should.equal(0);
          }));
      });

      it('shows the popup with the correct text', () =>
        loadAndSelect('a').then(app => {
          const popup = app.first('#form-attachment-popups-main');
          popup.should.be.visible();
          const text = popup.first('p').text().trim().iTrim();
          text.should.equal('1 file ready for upload.');
        }));

      describe('after the uploads are canceled', () => {
        it('unhighlights the rows', () =>
          loadAndSelect('a')
            .then(app =>
              trigger.click(app, '#form-attachment-popups-main .btn-link'))
            .then(app => {
              app.find('.form-attachment-row-targeted').should.be.empty();
            }));

        it('hides the popup', () =>
          loadAndSelect('a')
            .then(app =>
              trigger.click(app, '#form-attachment-popups-main .btn-link'))
            .then(app => {
              app.first('#form-attachment-popups-main').should.be.hidden();
            }));
      });
    });

    describe('unmatched file after a selection', () => {
      beforeEach(() => {
        testData.extendedFormAttachments
          .createPast(1, { name: 'a' })
          .createPast(1, { name: 'b' });
      });

      it('correctly renders if the file matches', () =>
        loadAndSelect('a', { attachToDocument: true }).then(app => {
          const popup = app.first('#form-attachment-popups-main');
          popup.should.be.visible();
          const text = popup.first('p').text().trim().iTrim();
          text.should.equal('1 file ready for upload.');
          popup.first('#form-attachment-popups-unmatched').should.be.hidden();
          popup.first('.btn-primary').should.be.focused();
        }));

      it('correctly renders if the file does not match', () =>
        loadAndSelect('c', { attachToDocument: true }).then(app => {
          const popup = app.first('#form-attachment-popups-main');
          popup.should.be.visible();
          const text = popup.first('p').text().trim().iTrim();
          text.should.containEql('We don’t recognize the file you are trying to upload.');
          popup.find('#form-attachment-popups-unmatched').should.be.empty();
          popup.first('.btn-primary').should.be.focused();
        }));

      it('allows the user to close the popup if the file does not match', () =>
        loadAndSelect('c')
          .then(app => {
            const popup = app.first('#form-attachment-popups-main');
            popup.element.style.display.should.equal('');
            return trigger.click(popup, '.btn-primary');
          })
          .then(popup => {
            popup.element.style.display.should.equal('none');
          }));
    });
  };

  /*
  The following tests will be run under four different scenarios:

    1. The user drops a single file over an attachment with the same name.
    2. The user drops a single file over an attachment with a different name,
       then confirms the upload in the name mismatch modal.
    3. The user drops a single file outside a row of the table as if under IE
       (where countOfFilesOverDropZone === -1), then confirms the upload in the
       popup.
    4. The user drops a single file outside a row of the table normally
       (where countOfFilesOverDropZone === 1), then confirms the upload in the
       popup.

  For each scenario, the function is passed a callback (`upload`) that starts
  the upload.

  The user must be logged in before these tests.
  */
  const testSingleFileUpload = (upload) => {
    beforeEach(() => {
      testData.extendedFormAttachments
        .createPast(1, { name: 'a', exists: true })
        .createPast(1, { name: 'b', exists: false, hasUpdatedAt: false })
        // Deleted attachment
        .createPast(1, { name: 'c', exists: false, hasUpdatedAt: true });
    });

    it('shows a backdrop', () =>
      upload('a')
        .beforeResponse(app => {
          app.first('#form-attachment-popups-backdrop').should.be.visible();
        })
        .respondWithSuccess());

    it('shows the popup with the correct text', () =>
      upload('a')
        .respondWithSuccess()
        .beforeEachResponse((app, request) => {
          const popup = app.first('#form-attachment-popups-main');
          popup.should.be.visible();
          const text = popup.find('p').map(p => p.text().trim());
          text.length.should.equal(2);
          text[1].should.containEql(`Sending ${request.data.name}`);
        }));

    describe('the upload succeeds', () => {
      describe('updatedAt', () => {
        it('updates the table for an existing attachment', () =>
          upload('a')
            .respondWithSuccess()
            .afterResponse(app => {
              const oldUpdatedAt = testData.extendedFormAttachments.sorted()
                .map(attachment => attachment.updatedAt);
              const newUpdatedAt = app.vm.$store.state.request.data.attachments
                .map(attachment => attachment.updatedAt);
              (newUpdatedAt[0] > oldUpdatedAt[0]).should.be.true();
              should.not.exist(newUpdatedAt[1]);
              newUpdatedAt[2].should.equal(oldUpdatedAt[2]);
            }));

        it('updates the table for an attachment that has never been uploaded', () =>
          upload('b')
            .respondWithSuccess()
            .afterResponse(app => {
              const oldUpdatedAt = testData.extendedFormAttachments.sorted()
                .map(attachment => attachment.updatedAt);
              const newUpdatedAt = app.vm.$store.state.request.data.attachments
                .map(attachment => attachment.updatedAt);
              newUpdatedAt[0].should.equal(oldUpdatedAt[0]);
              should.exist(newUpdatedAt[1]);
              newUpdatedAt[2].should.equal(oldUpdatedAt[2]);
            }));

        it('updates the table for a deleted attachment', () =>
          upload('c')
            .respondWithSuccess()
            .afterResponse(app => {
              const oldUpdatedAt = testData.extendedFormAttachments.sorted()
                .map(attachment => attachment.updatedAt);
              const newUpdatedAt = app.vm.$store.state.request.data.attachments
                .map(attachment => attachment.updatedAt);
              newUpdatedAt[0].should.equal(oldUpdatedAt[0]);
              should.not.exist(newUpdatedAt[1]);
              (newUpdatedAt[2] > oldUpdatedAt[2]).should.be.true();
            }));
      });

      it('shows a success alert', () =>
        upload('a')
          .respondWithSuccess()
          .afterResponse(app => {
            app.should.alert('success', '1 file has been successfully uploaded.');
          }));

      describe('highlight', () => {
        it('highlights the updated attachment', () =>
          upload('a')
            .respondWithSuccess()
            .afterResponse(app => {
              const highlighted = app.find('#form-attachment-list-table tbody tr')
                .map(tr => tr.hasClass('success'));
              highlighted.should.eql([true, false, false]);
            }));

        it('unhighlights the attachment once a new drag starts', () =>
          upload('a')
            .respondWithSuccess()
            .afterResponses(app =>
              trigger.dragenter(app, FormAttachmentList, blankFiles(['d'])))
            .then(app => {
              const highlighted = app.find('#form-attachment-list-table .success');
              highlighted.should.be.empty();
            }));

        it('unhighlights the attachment after a file input selection', () =>
          upload('a')
            .respondWithSuccess()
            .afterResponses(app =>
              selectFilesUsingModal(app, blankFiles(['d'])))
            .then(app => {
              const highlighted = app.find('#form-attachment-list-table .success');
              highlighted.should.be.empty();
            }));
      });
    });

    describe('the upload does not succeed', () => {
      let app;
      beforeEach(() => upload('a')
        .respondWithProblem(() => ({ code: 500, message: 'Failed.' }))
        .afterResponses(component => {
          app = component;
        }));

      it('does not update the table', () => {
        const oldUpdatedAt = testData.extendedFormAttachments.sorted()
          .map(attachment => attachment.updatedAt);
        const newUpdatedAt = app.vm.$store.state.request.data.attachments
          .map(attachment => attachment.updatedAt);
        newUpdatedAt[0].should.equal(oldUpdatedAt[0]);
        should.not.exist(newUpdatedAt[1]);
        newUpdatedAt[2].should.equal(oldUpdatedAt[2]);
      });

      it('shows a danger alert', () => {
        app.should.alert('danger', 'Failed.');
      });

      it('does not highlight any attachment', () => {
        const highlighted = app.find('#form-attachment-list-table .success');
        highlighted.should.be.empty();
      });
    });
  };

  // One way for the user to select what to upload is to drag and drop one or
  // more files outside a row of the table. Here we test that drag and drop, as
  // well as the upload that follows.
  for (const ie of [false, true]) {
    const not = ie ? '' : 'not ';
    describe(`dragging and dropping outside a row of the table ${not}using IE`, () => {
      beforeEach(mockLogin);

      describe('multiple files', () => {
        describe('drag', () => {
          let app;
          beforeEach(() => {
            testData.extendedFormAttachments.createPast(2);
            // Specifying `route: true` in order to trigger the Vue activated
            // hook, which attaches the jQuery event handlers.
            return loadAttachments({ route: true }).then(component => {
              app = component;
              return trigger.dragenter(
                app,
                '#form-attachment-list-heading div',
                { files: blankFiles(['a', 'b']), ie }
              );
            });
          });

          it('highlights all the rows of the table', () => {
            for (const tr of app.find('#form-attachment-list-table tbody tr'))
              tr.hasClass('info').should.be.true();
          });

          it('shows the popup with the correct text', () => {
            const popup = app.first('#form-attachment-popups-main');
            popup.should.be.visible();
            const text = popup.first('p').text().trim().iTrim();
            text.should.equal(!ie
              ? 'Drop now to prepare 2 files for upload to this form.'
              : 'Drop now to upload to this form.');
          });
        });

        describe('drop', () => {
          testMultipleFileSelection((app, files) =>
            trigger.dragAndDrop(app, FormAttachmentList, { files, ie }));
        });

        describe('confirming the uploads', () => {
          beforeEach(() => {
            testData.extendedFormAttachments
              .createPast(1, { name: 'a', exists: true })
              .createPast(1, { name: 'b', exists: false, hasUpdatedAt: false })
              // Deleted attachment
              .createPast(1, { name: 'c', exists: false, hasUpdatedAt: true })
              .createPast(1, { name: 'd' });
          });

          const confirmUploads = () => loadAttachments({ route: true })
            .afterResponses(app => trigger.dragAndDrop(
              app,
              FormAttachmentList,
              { files: blankFiles(['a', 'b', 'c']), ie }
            ))
            .request(app =>
              trigger.click(app, '#form-attachment-popups-main .btn-primary'));

          it('shows a backdrop', () =>
            confirmUploads()
              .respondWithSuccess()
              .respondWithSuccess()
              .respondWithSuccess()
              .beforeEachResponse(app => {
                const backdrop = app.first('#form-attachment-popups-backdrop');
                backdrop.should.be.visible();
              }));

          it('shows the popup with the correct text', () =>
            confirmUploads()
              .respondWithSuccess()
              .respondWithSuccess()
              .respondWithSuccess()
              .beforeEachResponse((app, request, index) => {
                const popup = app.first('#form-attachment-popups-main');
                popup.should.be.visible();
                const text = popup.find('p').map(p => p.text().trim());
                text.length.should.equal(3);
                text[1].should.containEql(`Sending ${request.data.name}`);
                if (index !== 2)
                  text[2].should.equal(`${3 - index} files remain.`);
                else
                  text[2].should.equal('This is the last file.');
              }));

          describe('all uploads succeed', () => {
            let app;
            beforeEach(() => confirmUploads()
              .respondWithSuccess()
              .respondWithSuccess()
              .respondWithSuccess()
              .afterResponses(component => {
                app = component;
              }));

            it('updates the table', () => {
              const oldUpdatedAt = testData.extendedFormAttachments.sorted()
                .map(attachment => attachment.updatedAt);
              const newUpdatedAt = app.vm.$store.state.request.data.attachments
                .map(attachment => attachment.updatedAt);
              (newUpdatedAt[0] > oldUpdatedAt[0]).should.be.true();
              should.exist(newUpdatedAt[1]);
              (newUpdatedAt[2] > oldUpdatedAt[2]).should.be.true();
            });

            it('shows a success alert', () => {
              app.should.alert('success', '3 files have been successfully uploaded.');
            });

            describe('highlight', () => {
              it('highlights the updated attachments', () => {
                const rows = app.find('#form-attachment-list-table tbody tr');
                const highlighted = rows.map(row => row.hasClass('success'));
                highlighted.should.eql([true, true, true, false]);
              });

              it('unhighlights the attachments once a new drag starts', () => {
                const files = blankFiles(['y', 'z']);
                return trigger.dragenter(app, FormAttachmentList, { files, ie })
                  .then(() => {
                    const table = app.first('#form-attachment-list-table');
                    table.find('.success').should.be.empty();
                  });
              });

              it('unhighlights the attachments after a file input selection', () =>
                selectFilesUsingModal(app, blankFiles(['y', 'z'])).then(() => {
                  const table = app.first('#form-attachment-list-table');
                  table.find('.success').should.be.empty();
                }));
            });
          });

          describe('only 2 uploads succeed', () => {
            let app;
            beforeEach(() => confirmUploads()
              .respondWithSuccess()
              .respondWithSuccess()
              .respondWithProblem(() => ({ code: 500, message: 'Failed.' }))
              .afterResponses(component => {
                app = component;
              }));

            it('updates the table', () => {
              const oldUpdatedAt = testData.extendedFormAttachments.sorted()
                .map(attachment => attachment.updatedAt);
              const newUpdatedAt = app.vm.$store.state.request.data.attachments
                .map(attachment => attachment.updatedAt);
              (newUpdatedAt[0] > oldUpdatedAt[0]).should.be.true();
              should.exist(newUpdatedAt[1]);
              newUpdatedAt[2].should.equal(oldUpdatedAt[2]);
            });

            it('shows a danger alert', () => {
              app.should.alert(
                'danger',
                'Failed. Only 2 of 3 files were successfully uploaded.'
              );
            });

            it('highlights the updated attachments', () => {
              const rows = app.find('#form-attachment-list-table tbody tr');
              const highlighted = rows.map(row => row.hasClass('success'));
              highlighted.should.eql([true, true, false, false]);
            });
          });

          describe('only 1 upload succeeds', () => {
            let app;
            beforeEach(() => confirmUploads()
              .respondWithSuccess()
              .respondWithProblem(() => ({ code: 500, message: 'Failed.' }))
              .afterResponses(component => {
                app = component;
              }));

            it('updates the table', () => {
              const oldUpdatedAt = testData.extendedFormAttachments.sorted()
                .map(attachment => attachment.updatedAt);
              const newUpdatedAt = app.vm.$store.state.request.data.attachments
                .map(attachment => attachment.updatedAt);
              (newUpdatedAt[0] > oldUpdatedAt[0]).should.be.true();
              should.not.exist(newUpdatedAt[1]);
              newUpdatedAt[2].should.equal(oldUpdatedAt[2]);
            });

            it('shows a danger alert', () => {
              app.should.alert(
                'danger',
                'Failed. Only 1 of 3 files was successfully uploaded.'
              );
            });

            it('highlights the updated attachment', () => {
              const rows = app.find('#form-attachment-list-table tbody tr');
              const highlighted = rows.map(row => row.hasClass('success'));
              highlighted.should.eql([true, false, false, false]);
            });
          });

          describe('no uploads succeed', () => {
            let app;
            beforeEach(() => confirmUploads()
              .respondWithProblem(() => ({ code: 500, message: 'Failed.' }))
              .afterResponses(component => {
                app = component;
              }));

            it('does not update the table', () => {
              const oldUpdatedAt = testData.extendedFormAttachments.sorted()
                .map(attachment => attachment.updatedAt);
              const newUpdatedAt = app.vm.$store.state.request.data.attachments
                .map(attachment => attachment.updatedAt);
              newUpdatedAt[0].should.equal(oldUpdatedAt[0]);
              should.not.exist(newUpdatedAt[1]);
              newUpdatedAt[2].should.equal(oldUpdatedAt[2]);
            });

            it('shows a danger alert', () => {
              app.should.alert(
                'danger',
                'Failed. No files were successfully uploaded.'
              );
            });

            it('does not highlight any attachment', () => {
              const table = app.first('#form-attachment-list-table');
              table.find('.success').should.be.empty();
            });
          });
        });
      });

      describe('single file', () => {
        describe('drag', () => {
          let app;
          beforeEach(() => {
            testData.extendedFormAttachments.createPast(2);
            return loadAttachments({ route: true }).then(component => {
              app = component;
              return trigger.dragenter(
                app,
                '#form-attachment-list-heading div',
                { files: blankFiles(['a']), ie }
              );
            });
          });

          it('highlights all the rows of the table', () => {
            for (const tr of app.find('#form-attachment-list-table tbody tr'))
              tr.hasClass('info').should.be.true();
          });

          it('shows the popup with the correct text', () => {
            const popup = app.first('#form-attachment-popups-main');
            popup.should.be.visible();
            const text = popup.first('p').text().trim().iTrim();
            text.should.containEql(!ie
              ? 'Drag over the file entry you wish to replace'
              : 'Drop now to upload to this form.');
          });
        });

        testSingleFileSelection((app, files) =>
          trigger.dragAndDrop(app, FormAttachmentList, { files, ie }));

        describe('confirming the upload', () =>
          testSingleFileUpload(attachmentName =>
            loadAttachments({ route: true })
              .afterResponses(app => trigger.dragAndDrop(
                app,
                FormAttachmentList,
                { files: blankFiles([attachmentName]), ie }
              ))
              .request(app =>
                trigger.click(app, '#form-attachment-popups-main .btn-primary'))));
      });
    });
  }

  describe('upload files modal', () => {
    beforeEach(mockLogin);

    describe('state', () => {
      beforeEach(() => {
        testData.extendedFormAttachments
          .createPast(1, { name: 'a' })
          .createPast(1, { name: 'b' });
      });

      it('is initially hidden', () =>
        loadAttachments().then(component => {
          const modal = component.first(FormAttachmentUploadFiles);
          modal.getProp('state').should.be.false();
        }));

      it('is shown after button click', () =>
        loadAttachments()
          .then(component =>
            trigger.click(component, '#form-attachment-list-heading button'))
          .then(component => {
            const modal = component.first(FormAttachmentUploadFiles);
            modal.getProp('state').should.be.true();
          }));
    });

    describe('select single file', () => {
      testSingleFileSelection(selectFilesUsingModal);
    });

    describe('select multiple files', () => {
      testMultipleFileSelection(selectFilesUsingModal);
    });
  });

  describe('dragging and dropping a single file over a row', () => {
    beforeEach(mockLogin);

    describe('drag over a row of the table', () => {
      it('highlights only the target row', () => {
        testData.extendedFormAttachments.createPast(2);
        return loadAttachments({ route: true })
          .then(app => trigger.dragenter(
            app,
            '#form-attachment-list-table tbody tr',
            blankFiles(['a'])
          ))
          .then(app => {
            const tr = app.find('#form-attachment-list-table tbody tr');
            tr[0].hasClass('info').should.be.true();
            tr[0].hasClass('form-attachment-row-targeted').should.be.true();
            tr[1].hasClass('info').should.be.false();
          });
      });

      it('shows a Replace label if the attachment exists', () => {
        testData.extendedFormAttachments.createPast(2, { exists: true });
        return loadAttachments({ route: true })
          .then(app => trigger.dragenter(
            app,
            '#form-attachment-list-table tbody tr',
            blankFiles(['a'])
          ))
          .then(app => {
            const labels = app.find('#form-attachment-list-table .label');
            labels.length.should.equal(2);
            labels[0].should.be.visible();
            labels[1].should.be.hidden();
          });
      });

      it('does not show a Replace label if the attachment does not exist', () => {
        testData.extendedFormAttachments.createPast(2, { exists: false });
        return loadAttachments({ route: true })
          .then(app => trigger.dragenter(
            app,
            '#form-attachment-list-table tbody tr',
            blankFiles(['a'])
          ))
          .then(app => {
            app.find('#form-attachment-list-table .label').length.should.equal(0);
          });
      });

      it('shows the popup with the correct text', () => {
        testData.extendedFormAttachments
          .createPast(1, { name: 'first_attachment' })
          .createPast(1, { name: 'second_attachment' });
        return loadAttachments({ route: true })
          .then(app => trigger.dragenter(
            app,
            '#form-attachment-list-table tbody tr',
            blankFiles(['a'])
          ))
          .then(app => {
            const popup = app.first('#form-attachment-popups-main');
            popup.should.be.visible();
            const text = popup.first('p').text().trim().iTrim();
            text.should.equal('Drop now to upload this file as first_attachment.');
          });
      });
    });

    const dragAndDropOntoRow = (app, attachmentName, filename) => {
      const tr = app.find('#form-attachment-list-table tbody tr');
      const attachments = testData.extendedFormAttachments.sorted();
      tr.length.should.equal(attachments.length);
      for (let i = 0; i < tr.length; i += 1) {
        if (attachments[i].name === attachmentName) {
          return trigger.dragAndDrop(tr[i], blankFiles([filename]))
            .then(() => app);
        }
      }
      throw new Error('matching attachment not found');
    };

    describe('drop over an attachment with the same name', () => {
      testSingleFileUpload(attachmentName => loadAttachments({ route: true })
        .complete()
        .request(app =>
          dragAndDropOntoRow(app, attachmentName, attachmentName)));
    });

    describe('drop over an attachment with a different name', () => {
      const dropMismatchingFile = (attachmentName) =>
        loadAttachments({ route: true }).afterResponses(app =>
          dragAndDropOntoRow(app, attachmentName, 'mismatching_file'));

      describe('name mismatch modal', () => {
        beforeEach(() => {
          testData.extendedFormAttachments
            .createPast(1, { name: 'a', exists: true })
            .createPast(1, { name: 'b', exists: false });
        });

        it('is initially hidden', () =>
          loadAttachments({ route: true })
            .then(app => {
              const modal = app.first(FormAttachmentNameMismatch);
              modal.getProp('state').should.be.false();
            }));

        it('is shown after the drop', () =>
          dropMismatchingFile('a')
            .then(app => {
              const modal = app.first(FormAttachmentNameMismatch);
              modal.getProp('state').should.be.true();
            }));

        it('is hidden upon cancel', () =>
          dropMismatchingFile('a')
            .then(app => {
              const modal = app.first(FormAttachmentNameMismatch);
              return trigger.click(modal, '.btn-link');
            })
            .then(modal => {
              modal.getProp('state').should.be.false();
            }));

        it('renders correctly for an existing attachment', () =>
          dropMismatchingFile('a')
            .then(app => {
              const modal = app.first(FormAttachmentNameMismatch);
              const title = modal.first('.modal-title').text().trim();
              title.should.equal('Replace File');
            }));

        it('renders correctly for a missing attachment', () =>
          dropMismatchingFile('b')
            .then(app => {
              const modal = app.first(FormAttachmentNameMismatch);
              const title = modal.first('.modal-title').text().trim();
              title.should.equal('Upload File');
            }));
      });

      testSingleFileUpload(attachmentName => dropMismatchingFile(attachmentName)
        .request(app => {
          const modal = app.first(FormAttachmentNameMismatch);
          return trigger.click(modal, '.btn-primary').then(() => app);
        }));
    });
  });

  describe('gzipping', () => {
    beforeEach(mockLogin);

    const cases = [
      {
        name: 'not_csv.txt',
        contents: 'abcd',
        gzip: false
      },
      {
        name: 'small_csv.csv',
        contents: 'a,b,c,d\na,b,c,d\n',
        gzip: false
      },
      {
        name: 'large_csv.csv',
        contents: 'a,b,c,d\n'.repeat(2000),
        gzip: true
      }
    ];

    for (const { name, contents, gzip } of cases) {
      it(`${gzip ? 'gzips' : 'does not gzip'} ${name}`, () => {
        testData.extendedFormAttachments.createPast(1, { name });
        const file = new File([contents], name);
        return loadAttachments({ route: true })
          .complete()
          .request(app =>
            trigger.dragAndDrop(app, '#form-attachment-list-table tbody tr', [file]))
          .beforeEachResponse((app, request) => {
            const encoding = gzip ? 'gzip' : 'identity';
            request.headers['Content-Encoding'].should.equal(encoding);
            if (!gzip) {
              request.data.should.equal(file);
            } else {
              const inflated = pako.inflate(request.data, { to: 'string' });
              inflated.should.equal(contents);
            }
          })
          .respondWithSuccess()
          .afterResponses({
            pollWork: (app) => !app.first(FormAttachmentList).data().uploading,
            callback: () => {}
          });
      });
    }
  });
});

import DateTime from '../../../src/components/date-time.vue';
import FormAttachmentNameMismatch from '../../../src/components/form-attachment/name-mismatch.vue';
import FormAttachmentRow from '../../../src/components/form-attachment/row.vue';
import FormAttachmentUploadFiles from '../../../src/components/form-attachment/upload-files.vue';

import testData from '../../data';
import { dragAndDrop, fileDataTransfer, setFiles } from '../../util/trigger';
import { isBefore } from '../../util/date-time';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';

const blankFiles = (names) => names.map(name => new File([''], name));

describe('FormAttachmentList', () => {
  beforeEach(mockLogin);

  describe('table', () => {
    beforeEach(() => {
      testData.extendedForms.createPast(1, { draft: true });
    });

    describe('attachment type', () => {
      const cases = [
        ['image', 'Image'],
        ['video', 'Video'],
        ['audio', 'Audio'],
        ['file', 'Data File'],
        ['not_a_type', 'not_a_type'],
        ['not.a.type', 'not.a.type']
      ];
      for (const [type, text] of cases) {
        it(`is correct for ${type}`, async () => {
          testData.standardFormAttachments.createPast(1, { type });
          const component = await load('/projects/1/forms/f/draft', {
            root: false
          });
          component.get('td.form-attachment-list-type').text().should.equal(text);
        });
      }
    });

    it('shows attachment name if attachment does not exist', async () => {
      testData.standardFormAttachments.createPast(1, {
        name: 'foo.jpg',
        blobExists: false
      });
      const component = await load('/projects/1/forms/f/draft', {
        root: false
      });
      const span = component.get('td.form-attachment-list-name span');
      span.text().should.equal('foo.jpg');
      await span.should.have.textTooltip();
    });

    it('shows a download link if the attachment exists', async () => {
      testData.standardFormAttachments.createPast(1, {
        name: 'foo bar.jpg',
        blobExists: true
      });
      const component = await load('/projects/1/forms/f/draft', {
        root: false
      });
      const a = component.get('td.form-attachment-list-name a');
      const { href } = a.attributes();
      href.should.equal('/v1/projects/1/forms/f/draft/attachments/foo%20bar.jpg');
      a.text().should.equal('foo bar.jpg');
      await a.should.have.textTooltip();
    });

    describe('updatedAt', () => {
      it('formats updatedAt for an existing attachment', async () => {
        const { updatedAt } = testData.standardFormAttachments
          .createPast(1, { blobExists: true })
          .last();
        const component = await load('/projects/1/forms/f/draft', {
          root: false
        });
        const row = component.getComponent(FormAttachmentRow);
        const { iso } = row.getComponent(DateTime).props();
        iso.should.equal(updatedAt);
      });

      it('correctly renders an attachment that has never been uploaded', async () => {
        testData.standardFormAttachments.createPast(1, {
          blobExists: false,
          hasUpdatedAt: false
        });
        const component = await load('/projects/1/forms/f/draft', {
          root: false
        });
        const span = component.get('td.form-attachment-list-uploaded span');
        span.find('.icon-exclamation-triangle').exists().should.be.true;
        const text = span.get('.icon-exclamation-triangle + span').text();
        text.should.equal('Not yet uploaded');
        await span.should.have.tooltip(/^To upload files,/);
      });

      it('correctly renders a deleted attachment', async () => {
        testData.standardFormAttachments.createPast(1, {
          blobExists: false,
          hasUpdatedAt: true
        });
        const component = await load('/projects/1/forms/f/draft', {
          root: false
        });
        const span = component.get('td.form-attachment-list-uploaded span');
        span.find('.icon-exclamation-triangle').exists().should.be.true;
        const text = span.get('.icon-exclamation-triangle + span').text();
        text.should.equal('Not yet uploaded');
        await span.should.have.tooltip(/^To upload files,/);
      });
    });
  });

  /*
  testMultipleFileSelection() tests the effects of selecting multiple files to
  upload. It does not test the effects of actually uploading those files: that
  comes later. However, it tests everything between selecting the files and
  uploading them.

  The tests will be run under two scenarios:

    1. The user drops multiple files over the page.
    2. The user selects multiple files using the file input.

  For each scenario, the function is passed a callback (`select`) that selects
  the files.

  The user must be logged in before these tests.
  */
  const testMultipleFileSelection = (select) => {
    describe('table', () => {
      beforeEach(() => {
        testData.extendedForms.createPast(1, { draft: true });
        testData.standardFormAttachments
          .createPast(1, { name: 'a', blobExists: true })
          .createPast(1, { name: 'b', blobExists: false })
          .createPast(1, { name: 'c' });
      });

      it('highlights only matching rows', async () => {
        const component = await load('/projects/1/forms/f/draft', {
          root: false
        });
        await select(component, blankFiles(['a', 'b', 'd']));
        const rows = component.findAllComponents(FormAttachmentRow);
        const targeted = rows.map(row => row.classes('targeted'));
        targeted.should.eql([true, true, false]);
      });

      it('shows the correct labels', async () => {
        const component = await load('/projects/1/forms/f/draft', {
          root: false
        });
        await select(component, blankFiles(['a', 'b', 'd']));
        const labels = component.findAllComponents(FormAttachmentRow)
          .map(row => row.get('.label'));
        labels[0].should.be.visible();
        labels[0].text().should.equal('Replace');
        labels[1].should.be.visible();
        labels[1].text().should.equal('Upload');
        labels[2].should.be.hidden();
      });
    });

    describe('after the uploads are canceled', () => {
      beforeEach(() => {
        testData.extendedForms.createPast(1, { draft: true });
        testData.standardFormAttachments
          .createPast(1, { name: 'a', blobExists: true })
          .createPast(1, { name: 'b', blobExists: false })
          .createPast(1, { name: 'c' });
      });

      it('unhighlights the rows', async () => {
        const component = await load('/projects/1/forms/f/draft', {
          root: false
        });
        await select(component, blankFiles(['a', 'b', 'd']));
        await component.get('#form-attachment-popups-main .btn-link').trigger('click');
        component.find('.form-attachment-row.targeted').exists().should.be.false;
      });

      it('hides the popup', async () => {
        const component = await load('/projects/1/forms/f/draft', {
          root: false
        });
        await select(component, blankFiles(['a', 'b', 'd']));
        const popup = component.get('#form-attachment-popups-main');
        await popup.get('.btn-link').trigger('click');
        popup.should.be.hidden();
      });
    });

    describe('unmatched files', () => {
      beforeEach(() => {
        testData.extendedForms.createPast(1, { draft: true });
        testData.standardFormAttachments
          .createPast(1, { name: 'a' })
          .createPast(1, { name: 'b' })
          .createPast(1, { name: 'c' });
      });

      it('renders correctly if there are no unmatched files', async () => {
        const component = await load('/projects/1/forms/f/draft', {
          root: false,
          attachTo: document.body
        });
        await select(component, blankFiles(['a', 'b']));
        const popup = component.get('#form-attachment-popups-main');
        popup.should.be.visible();
        popup.get('p').text().should.equal('2 files ready for upload.');
        popup.get('#form-attachment-popups-unmatched').should.be.hidden();
        popup.get('.btn-primary').should.be.focused();
      });

      it('renders correctly if there is one unmatched file', async () => {
        const component = await load('/projects/1/forms/f/draft', {
          root: false,
          attachTo: document.body
        });
        await select(component, blankFiles(['a', 'd']));
        const popup = component.get('#form-attachment-popups-main');
        popup.should.be.visible();
        popup.get('p').text().should.equal('1 file ready for upload.');
        const unmatched = popup.get('#form-attachment-popups-unmatched');
        unmatched.should.be.visible();
        unmatched.find('.icon-exclamation-triangle').exists().should.be.true;
        unmatched.text().should.startWith('1 file has a name we don’t recognize and will be ignored.');
        popup.get('.btn-primary').should.be.focused();
      });

      it('renders correctly if there are multiple unmatched files', async () => {
        const component = await load('/projects/1/forms/f/draft', {
          root: false,
          attachTo: document.body
        });
        await select(component, blankFiles(['a', 'd', 'e']));
        const popup = component.get('#form-attachment-popups-main');
        popup.should.be.visible();
        popup.get('p').text().should.equal('1 file ready for upload.');
        const unmatched = popup.get('#form-attachment-popups-unmatched');
        unmatched.should.be.visible();
        unmatched.find('.icon-exclamation-triangle').exists().should.be.true;
        unmatched.text().should.startWith('2 files have a name we don’t recognize and will be ignored.');
        popup.get('.btn-primary').should.be.focused();
      });

      it('renders correctly if all files are unmatched', async () => {
        const component = await load('/projects/1/forms/f/draft', {
          root: false,
          attachTo: document.body
        });
        await select(component, blankFiles(['d', 'e']));
        const popup = component.get('#form-attachment-popups-main');
        popup.should.be.visible();
        popup.get('p').text().should.startWith('We don’t recognize any of the files');
        popup.find('#form-attachment-popups-unmatched').exists().should.be.false;
        popup.get('.btn-primary').should.be.focused();
      });

      it('allows user to close popup if all files are unmatched', async () => {
        const component = await load('/projects/1/forms/f/draft', {
          root: false
        });
        await select(component, blankFiles(['d', 'e']));
        const popup = component.get('#form-attachment-popups-main');
        popup.should.be.visible();
        await popup.get('.btn-primary').trigger('click');
        popup.should.be.hidden();
      });
    });
  };

  /*
  testSingleFileSelection() tests the effects of selecting a single file to
  upload. It does not test the effects of actually uploading the file: that
  comes later. However, it tests everything between selecting the file and
  uploading it.

  The tests will be run under two scenarios:

    1. The user drops a single file outside a row of the table.
    2. The user selects a single file using the file input.

  The tests are not run under the following scenario, which differs in a few
  ways:

    - The user drops a single file over an attachment.

  For each scenario, the function is passed a callback (`select`) that selects
  the file.

  The user must be logged in before these tests.
  */
  const testSingleFileSelection = (select) => {
    describe('after a selection', () => {
      beforeEach(() => {
        testData.extendedForms.createPast(1, { draft: true });
        testData.standardFormAttachments
          .createPast(1, { name: 'a', blobExists: true })
          .createPast(1, { name: 'b', blobExists: false })
          .createPast(1, { name: 'c', blobExists: true })
          .createPast(1, { name: 'd', blobExists: false });
      });

      it('highlights only the matching row', async () => {
        const component = await load('/projects/1/forms/f/draft', {
          root: false
        });
        await select(component, blankFiles(['a']));
        const rows = component.findAllComponents(FormAttachmentRow);
        const targeted = rows.map(row => row.classes('targeted'));
        targeted.should.eql([true, false, false, false]);
      });

      describe('label', () => {
        it('shows the correct text for an existing attachment', async () => {
          const component = await load('/projects/1/forms/f/draft', {
            root: false
          });
          await select(component, blankFiles(['a']));
          const labels = component.findAllComponents(FormAttachmentRow)
            .map(row => row.get('.label'));
          labels[0].should.be.visible();
          labels[0].text().should.equal('Replace');
          labels[1].should.be.hidden();
          labels[2].should.be.hidden();
          labels[3].should.be.hidden();
        });

        it('shows the correct text for a missing attachment', async () => {
          const component = await load('/projects/1/forms/f/draft', {
            root: false
          });
          await select(component, blankFiles(['b']));
          const labels = component.findAllComponents(FormAttachmentRow)
            .map(row => row.get('.label'));
          labels[0].should.be.hidden();
          labels[1].should.be.visible();
          labels[1].text().should.equal('Upload');
          labels[2].should.be.hidden();
          labels[3].should.be.hidden();
        });
      });

      it('shows the popup with the correct text', async () => {
        const component = await load('/projects/1/forms/f/draft', {
          root: false
        });
        await select(component, blankFiles(['a']));
        const popup = component.get('#form-attachment-popups-main');
        popup.should.be.visible();
        popup.get('p').text().should.equal('1 file ready for upload.');
      });

      describe('after the uploads are canceled', () => {
        it('unhighlights the rows', async () => {
          const component = await load('/projects/1/forms/f/draft', {
            root: false
          });
          await select(component, blankFiles(['a']));
          await component.get('#form-attachment-popups-main .btn-link').trigger('click');
          component.find('.form-attachment-row.targeted').exists().should.be.false;
        });

        it('hides the popup', async () => {
          const component = await load('/projects/1/forms/f/draft', {
            root: false
          });
          await select(component, blankFiles(['a']));
          await component.get('#form-attachment-popups-main .btn-link').trigger('click');
          component.get('#form-attachment-popups-main').should.be.hidden();
        });
      });
    });

    describe('unmatched file after a selection', () => {
      beforeEach(() => {
        testData.extendedForms.createPast(1, { draft: true });
        testData.standardFormAttachments
          .createPast(1, { name: 'a' })
          .createPast(1, { name: 'b' });
      });

      it('correctly renders if the file matches', async () => {
        const component = await load('/projects/1/forms/f/draft', {
          root: false,
          attachTo: document.body
        });
        await select(component, blankFiles(['a']));
        const popup = component.get('#form-attachment-popups-main');
        popup.should.be.visible();
        popup.get('p').text().should.equal('1 file ready for upload.');
        popup.get('#form-attachment-popups-unmatched').should.be.hidden();
        popup.get('.btn-primary').should.be.focused();
      });

      it('correctly renders if the file does not match', async () => {
        const component = await load('/projects/1/forms/f/draft', {
          root: false,
          attachTo: document.body
        });
        await select(component, blankFiles(['c']));
        const popup = component.get('#form-attachment-popups-main');
        popup.should.be.visible();
        popup.get('p').text().should.startWith('We don’t recognize the file');
        popup.find('#form-attachment-popups-unmatched').exists().should.be.false;
        popup.get('.btn-primary').should.be.focused();
      });

      it('allows user to close popup if file does not match', async () => {
        const component = await load('/projects/1/forms/f/draft', {
          root: false
        });
        await select(component, blankFiles(['c']));
        const popup = component.get('#form-attachment-popups-main');
        popup.should.be.visible();
        await popup.get('.btn-primary').trigger('click');
        popup.should.be.hidden();
      });
    });
  };

  /*
  The following tests will be run under three different scenarios:

    1. The user drops a single file over an attachment with the same name.
    2. The user drops a single file over an attachment with a different name,
       then confirms the upload in the name mismatch modal.
    3. The user drops a single file outside a row of the table, then confirms
       the upload in the popup.

  For each scenario, the function is passed a callback (`upload`) that starts
  the upload.

  The user must be logged in before these tests.
  */
  const testSingleFileUpload = (upload) => {
    beforeEach(() => {
      testData.extendedForms.createPast(1, { draft: true });
      testData.standardFormAttachments
        .createPast(1, { name: 'a', blobExists: true })
        .createPast(1, { name: 'b', blobExists: false, hasUpdatedAt: false })
        // Deleted attachment
        .createPast(1, { name: 'c', blobExists: false, hasUpdatedAt: true });
    });

    it('shows a backdrop', () =>
      upload('a')
        .beforeAnyResponse(component => {
          component.get('#form-attachment-popups-backdrop').should.be.visible();
        })
        .respondWithData(() => testData.standardFormAttachments.update(0)));

    it('shows the popup with the correct text', () =>
      upload('a')
        .respondWithData(() => testData.standardFormAttachments.update(0))
        .beforeEachResponse((component, { data }) => {
          const popup = component.get('#form-attachment-popups-main');
          component.should.be.visible();
          const p = popup.findAll('p');
          p.length.should.equal(2);
          p[1].text().should.startWith(`Sending ${data.name}`);
        }));

    describe('the upload succeeds', () => {
      describe('updatedAt', () => {
        it('updates the table for an existing attachment', () => {
          const oldUpdatedAt = testData.standardFormAttachments.sorted()
            .map(attachment => attachment.updatedAt);
          return upload('a')
            .respondWithData(() => testData.standardFormAttachments.update(0))
            .afterResponse(component => {
              const { draftAttachments } = component.vm.$container.requestData.localResources;
              const newUpdatedAt = [...draftAttachments.values()]
                .map(attachment => attachment.updatedAt);
              isBefore(oldUpdatedAt[0], newUpdatedAt[0]).should.be.true;
              should.not.exist(newUpdatedAt[1]);
              newUpdatedAt[2].should.equal(oldUpdatedAt[2]);
            });
        });

        it('updates table for an attachment that has never been uploaded', () => {
          const oldUpdatedAt = testData.standardFormAttachments.sorted()
            .map(attachment => attachment.updatedAt);
          return upload('b')
            .respondWithData(() => testData.standardFormAttachments.update(1, {
              blobExists: true,
              exists: true,
              hash: 'foo'
            }))
            .afterResponse(component => {
              const { draftAttachments } = component.vm.$container.requestData.localResources;
              const newUpdatedAt = [...draftAttachments.values()]
                .map(attachment => attachment.updatedAt);
              newUpdatedAt[0].should.equal(oldUpdatedAt[0]);
              should.exist(newUpdatedAt[1]);
              newUpdatedAt[2].should.equal(oldUpdatedAt[2]);
            });
        });

        it('updates the table for a deleted attachment', () => {
          const oldUpdatedAt = testData.standardFormAttachments.sorted()
            .map(attachment => attachment.updatedAt);
          return upload('c')
            .respondWithData(() => testData.standardFormAttachments.update(2, {
              blobExists: true,
              exists: true,
              hash: 'foo'
            }))
            .afterResponse(component => {
              const { draftAttachments } = component.vm.$container.requestData.localResources;
              const newUpdatedAt = [...draftAttachments.values()]
                .map(attachment => attachment.updatedAt);
              newUpdatedAt[0].should.equal(oldUpdatedAt[0]);
              should.not.exist(newUpdatedAt[1]);
              isBefore(oldUpdatedAt[2], newUpdatedAt[2]).should.be.true;
            });
        });
      });

      it('shows a success alert', () =>
        upload('a')
          .respondWithData(() => testData.standardFormAttachments.update(0))
          .afterResponse(component => {
            component.should.alert('success', '1 file has been successfully uploaded.');
          }));

      describe('highlight', () => {
        it('highlights the updated attachment', () =>
          upload('a')
            .respondWithData(() => testData.standardFormAttachments.update(0))
            .afterResponse(component => {
              const rows = component.findAllComponents(FormAttachmentRow);
              const success = rows.map(row => row.classes('success'));
              success.should.eql([true, false, false]);
            }));

        it('unhighlights the attachment once a new drag starts', () =>
          upload('a')
            .respondWithData(() => testData.standardFormAttachments.update(0))
            .afterResponse(async (component) => {
              await component.get('#form-attachment-list').trigger('dragenter', {
                dataTransfer: fileDataTransfer(blankFiles(['d']))
              });
              component.find('.form-attachment-row.success').exists().should.be.false;
            }));

        it('unhighlights the attachment after a file input selection', () =>
          upload('a')
            .respondWithData(() => testData.standardFormAttachments.update(0))
            .afterResponse(async (component) => {
              const input = component.get('#form-attachment-upload-files input');
              await setFiles(input, blankFiles(['d']));
              component.find('.form-attachment-row.success').exists().should.be.false;
            }));
      });
    });

    describe('the upload does not succeed', () => {
      it('does not update the table', () => {
        const oldUpdatedAt = testData.standardFormAttachments.sorted()
          .map(attachment => attachment.updatedAt);
        return upload('a')
          .respondWithProblem()
          .afterResponse(component => {
            const { draftAttachments } = component.vm.$container.requestData.localResources;
            const newUpdatedAt = [...draftAttachments.values()]
              .map(attachment => attachment.updatedAt);
            newUpdatedAt[0].should.equal(oldUpdatedAt[0]);
            should.not.exist(newUpdatedAt[1]);
            newUpdatedAt[2].should.equal(oldUpdatedAt[2]);
          });
      });

      it('shows a danger alert', () =>
        upload('a')
          .respondWithProblem({ code: 500.1, message: 'Failed.' })
          .afterResponse(component => {
            component.should.alert('danger', 'Failed.');
          }));

      it('does not highlight any attachment', () =>
        upload('a')
          .respondWithProblem()
          .afterResponse(component => {
            component.find('.form-attachment-row.success').exists().should.be.false;
          }));
    });
  };

  // One way for the user to select what to upload is to drag and drop one or
  // more files outside a row of the table. Here we test that drag and drop, as
  // well as the upload that follows.
  // TODO. Remove braces.
  { // eslint-disable-line no-lone-blocks
    describe('dragging and dropping outside a row of the table', () => {
      describe('multiple files', () => {
        describe('drag', () => {
          beforeEach(() => {
            testData.extendedForms.createPast(1, { draft: true });
            testData.standardFormAttachments.createPast(2);
          });

          it('highlights all the rows of the table', async () => {
            const component = await load('/projects/1/forms/f/draft', {
              root: false
            });
            await component.get('#form-attachment-list').trigger('dragenter', {
              dataTransfer: fileDataTransfer(blankFiles(['a', 'b']))
            });
            for (const row of component.findAllComponents(FormAttachmentRow))
              row.classes('info').should.be.true;
          });

          it('shows the popup with the correct text', async () => {
            const component = await load('/projects/1/forms/f/draft', {
              root: false
            });
            await component.get('#form-attachment-list').trigger('dragenter', {
              dataTransfer: fileDataTransfer(blankFiles(['a', 'b']))
            });
            const popup = component.get('#form-attachment-popups-main');
            popup.should.be.visible();
            popup.get('p').text().should.startWith('Drop now to prepare 2 files');
          });
        });

        describe('drop', () => {
          testMultipleFileSelection((component, files) =>
            dragAndDrop(component.get('#form-attachment-list'), files));
        });

        describe('confirming the uploads', () => {
          beforeEach(() => {
            testData.extendedForms.createPast(1, { draft: true });
            testData.standardFormAttachments
              .createPast(1, { name: 'a', blobExists: true })
              .createPast(1, { name: 'b', blobExists: false, hasUpdatedAt: false })
              // Deleted attachment
              .createPast(1, { name: 'c', blobExists: false, hasUpdatedAt: true })
              .createPast(1, { name: 'd' });
          });

          const confirmUploads = (successCount) =>
            load('/projects/1/forms/f/draft', { root: false })
              .complete()
              .request(async (component) => {
                await dragAndDrop(
                  component.get('#form-attachment-list'),
                  blankFiles(['a', 'b', 'c'])
                );
                const button = component.get('#form-attachment-popups-main .btn-primary');
                return button.trigger('click');
              })
              .modify(series => {
                let withResponses = series;
                for (let i = 0; i < successCount; i += 1) {
                  withResponses = withResponses.respondWithData(() =>
                    testData.standardFormAttachments.update(i, {
                      blobExists: true,
                      exists: true,
                      hash: 'foo'
                    }));
                }
                if (successCount < 3) {
                  withResponses = withResponses
                    .respondWithProblem({ code: 500.1, message: 'Failed.' });
                }
                return withResponses;
              });

          it('shows a backdrop', () =>
            confirmUploads(3).beforeEachResponse(component => {
              component.get('#form-attachment-popups-backdrop').should.be.visible();
            }));

          it('shows the popup with the correct text', () =>
            confirmUploads(3)
              .beforeEachResponse((component, { data }, index) => {
                const popup = component.get('#form-attachment-popups-main');
                popup.should.be.visible();
                const p = popup.findAll('p');
                p.length.should.equal(3);
                p[1].text().should.startWith(`Sending ${data.name}`);
                p[2].text().should.equal(index < 2
                  ? `${3 - index} files remain.`
                  : 'This is the last file.');
              }));

          describe('all uploads succeed', () => {
            it('updates the table', async () => {
              const oldUpdatedAt = testData.standardFormAttachments.sorted()
                .map(attachment => attachment.updatedAt);
              const component = await confirmUploads(3);
              const { draftAttachments } = component.vm.$container.requestData.localResources;
              const newUpdatedAt = [...draftAttachments.values()]
                .map(attachment => attachment.updatedAt);
              isBefore(oldUpdatedAt[0], newUpdatedAt[0]).should.be.true;
              should.exist(newUpdatedAt[1]);
              isBefore(oldUpdatedAt[2], newUpdatedAt[2]).should.be.true;
            });

            it('shows a success alert', async () => {
              const component = await confirmUploads(3);
              component.should.alert('success', '3 files have been successfully uploaded.');
            });

            describe('highlight', () => {
              it('highlights the updated attachments', async () => {
                const component = await confirmUploads(3);
                const rows = component.findAllComponents(FormAttachmentRow);
                const success = rows.map(row => row.classes('success'));
                success.should.eql([true, true, true, false]);
              });

              it('unhighlights attachments once a new drag starts', async () => {
                const component = await confirmUploads(3);
                await component.get('#form-attachment-list').trigger('dragenter', {
                  dataTransfer: fileDataTransfer(blankFiles(['y', 'z']))
                });
                component.find('.form-attachment-row.success').exists().should.be.false;
              });

              it('unhighlights attachments after a file input selection', async () => {
                const component = await confirmUploads(3);
                const input = component.get('#form-attachment-upload-files input');
                await setFiles(input, blankFiles(['y', 'z']));
                component.find('.form-attachment-row.success').exists().should.be.false;
              });
            });
          });

          describe('only 2 uploads succeed', () => {
            it('updates the table', async () => {
              const oldUpdatedAt = testData.standardFormAttachments.sorted()
                .map(attachment => attachment.updatedAt);
              const component = await confirmUploads(2);
              const { draftAttachments } = component.vm.$container.requestData.localResources;
              const newUpdatedAt = [...draftAttachments.values()]
                .map(attachment => attachment.updatedAt);
              isBefore(oldUpdatedAt[0], newUpdatedAt[0]).should.be.true;
              should.exist(newUpdatedAt[1]);
              newUpdatedAt[2].should.equal(oldUpdatedAt[2]);
            });

            it('shows a danger alert', async () => {
              const component = await confirmUploads(2);
              component.should.alert(
                'danger',
                'Failed. Only 2 of 3 files were successfully uploaded.'
              );
            });

            it('highlights the updated attachments', async () => {
              const component = await confirmUploads(2);
              const rows = component.findAllComponents(FormAttachmentRow);
              const success = rows.map(row => row.classes('success'));
              success.should.eql([true, true, false, false]);
            });
          });

          describe('only 1 upload succeeds', () => {
            it('updates the table', async () => {
              const oldUpdatedAt = testData.standardFormAttachments.sorted()
                .map(attachment => attachment.updatedAt);
              const component = await confirmUploads(1);
              const { draftAttachments } = component.vm.$container.requestData.localResources;
              const newUpdatedAt = [...draftAttachments.values()]
                .map(attachment => attachment.updatedAt);
              isBefore(oldUpdatedAt[0], newUpdatedAt[0]).should.be.true;
              should.not.exist(newUpdatedAt[1]);
              newUpdatedAt[2].should.equal(oldUpdatedAt[2]);
            });

            it('shows a danger alert', async () => {
              const component = await confirmUploads(1);
              component.should.alert(
                'danger',
                'Failed. Only 1 of 3 files was successfully uploaded.'
              );
            });

            it('highlights the updated attachment', async () => {
              const component = await confirmUploads(1);
              const rows = component.findAllComponents(FormAttachmentRow);
              const success = rows.map(row => row.classes('success'));
              success.should.eql([true, false, false, false]);
            });
          });

          describe('no uploads succeed', () => {
            it('does not update the table', async () => {
              const oldUpdatedAt = testData.standardFormAttachments.sorted()
                .map(attachment => attachment.updatedAt);
              const component = await confirmUploads(0);
              const { draftAttachments } = component.vm.$container.requestData.localResources;
              const newUpdatedAt = [...draftAttachments.values()]
                .map(attachment => attachment.updatedAt);
              newUpdatedAt[0].should.equal(oldUpdatedAt[0]);
              should.not.exist(newUpdatedAt[1]);
              newUpdatedAt[2].should.equal(oldUpdatedAt[2]);
            });

            it('shows a danger alert', async () => {
              const component = await confirmUploads(0);
              component.should.alert(
                'danger',
                'Failed. No files were successfully uploaded.'
              );
            });

            it('does not highlight any attachment', async () => {
              const component = await confirmUploads(0);
              component.find('.form-attachment-row.success').exists().should.be.false;
            });
          });
        });
      });

      describe('single file', () => {
        describe('drag', () => {
          beforeEach(() => {
            testData.extendedForms.createPast(1, { draft: true });
            testData.standardFormAttachments.createPast(2);
          });

          it('highlights all the rows of the table', async () => {
            const component = await load('/projects/1/forms/f/draft', {
              root: false
            });
            await component.get('#form-attachment-list').trigger('dragenter', {
              dataTransfer: fileDataTransfer(blankFiles(['a']))
            });
            for (const row of component.findAllComponents(FormAttachmentRow))
              row.classes('info').should.be.true;
          });

          it('shows the popup with the correct text', async () => {
            const component = await load('/projects/1/forms/f/draft', {
              root: false
            });
            await component.get('#form-attachment-list').trigger('dragenter', {
              dataTransfer: fileDataTransfer(blankFiles(['a']))
            });
            const popup = component.get('#form-attachment-popups-main');
            popup.should.be.visible();
            const text = popup.get('p').text();
            text.should.startWith('Drag over the Form Attachment you wish to replace');
          });
        });

        testSingleFileSelection((component, files) =>
          dragAndDrop(component.get('#form-attachment-list'), files));

        describe('confirming the upload', () => {
          testSingleFileUpload(attachmentName =>
            load('/projects/1/forms/f/draft', { root: false })
              .complete()
              .request(async (component) => {
                await dragAndDrop(
                  component.get('#form-attachment-list'),
                  blankFiles([attachmentName])
                );
                const button = component.get('#form-attachment-popups-main .btn-primary');
                return button.trigger('click');
              }));
        });
      });
    });
  }

  describe('upload files modal', () => {
    it('toggles the modal', () => {
      testData.extendedForms.createPast(1, { draft: true });
      testData.standardFormAttachments
        .createPast(1, { name: 'a' })
        .createPast(1, { name: 'b' });
      return load('/projects/1/forms/f/draft', { root: false })
        .testModalToggles({
          modal: FormAttachmentUploadFiles,
          show: '#form-attachment-list-upload-button',
          hide: '.btn-primary'
        });
    });

    describe('select single file', () => {
      testSingleFileSelection((component, files) =>
        setFiles(component.get('#form-attachment-upload-files input'), files));
    });

    describe('select multiple files', () => {
      testMultipleFileSelection((component, files) =>
        setFiles(component.get('#form-attachment-upload-files input'), files));
    });

    it('resets the input after a file is selected', async () => {
      const modal = mount(FormAttachmentUploadFiles, {
        props: { state: true }
      });
      const input = modal.get('input');
      await setFiles(input, blankFiles(['a']));
      input.element.value.should.equal('');
    });
  });

  describe('dragging and dropping a single file over a row', () => {
    const dragAndDropOntoRow = (component, attachmentName, filename) => {
      const rows = component.findAll('.form-attachment-row');
      const attachments = testData.standardFormAttachments.sorted();
      rows.length.should.equal(attachments.length);
      const index = attachments.findIndex(attachment =>
        attachment.name === attachmentName);
      if (index === -1) throw new Error('matching attachment not found');
      return dragAndDrop(rows[index], blankFiles([filename]));
    };

    describe('drag over a row of the table', () => {
      beforeEach(() => {
        testData.extendedForms.createPast(1, { draft: true });
      });

      it('highlights only the target row', async () => {
        testData.standardFormAttachments.createPast(2);
        const component = await load('/projects/1/forms/f/draft', {
          root: false
        });
        const rows = component.findAll('.form-attachment-row');
        await rows[0].trigger('dragenter', {
          dataTransfer: fileDataTransfer(blankFiles(['a']))
        });
        rows[0].classes('info').should.be.true;
        rows[0].classes('targeted').should.be.true;
        rows[1].classes('info').should.be.false;
      });

      it('shows a Replace label if the attachment exists', async () => {
        testData.standardFormAttachments.createPast(2, { blobExists: true });
        const component = await load('/projects/1/forms/f/draft', {
          root: false
        });
        const rows = component.findAll('.form-attachment-row');
        await rows[0].trigger('dragenter', {
          dataTransfer: fileDataTransfer(blankFiles(['a']))
        });
        const labels = rows.map(row => row.get('.label'));
        labels[0].should.be.visible();
        labels[0].text().should.equal('Replace');
        labels[1].should.be.hidden();
      });

      it('shows an Override label if the dataset exists', async () => {
        testData.standardFormAttachments.createPast(2, { datasetExists: true });
        const component = await load('/projects/1/forms/f/draft', {
          root: false
        });
        const rows = component.findAll('.form-attachment-row');
        await rows[0].trigger('dragenter', {
          dataTransfer: fileDataTransfer(blankFiles(['a']))
        });
        const labels = rows.map(row => row.get('.label'));
        labels[0].should.be.visible();
        labels[0].text().should.equal('Override');
        labels[1].should.be.hidden();
      });

      it('shows an Upload label if the attachment does not exist', async () => {
        testData.standardFormAttachments.createPast(2, { blobExists: false });
        const component = await load('/projects/1/forms/f/draft', {
          root: false
        });
        const rows = component.findAll('.form-attachment-row');
        await rows[0].trigger('dragenter', {
          dataTransfer: fileDataTransfer(blankFiles(['a']))
        });
        const labels = rows.map(row => row.get('.label'));
        labels[0].should.be.visible();
        labels[0].text().should.equal('Upload');
        labels[1].should.be.hidden();
      });

      it('shows the popup with the correct text', async () => {
        testData.standardFormAttachments
          .createPast(1, { name: 'first_attachment' })
          .createPast(1, { name: 'second_attachment' });
        const component = await load('/projects/1/forms/f/draft', {
          root: false
        });
        await component.get('.form-attachment-row').trigger('dragenter', {
          dataTransfer: fileDataTransfer(blankFiles(['a']))
        });
        const popup = component.get('#form-attachment-popups-main');
        popup.should.be.visible();
        const text = popup.get('p').text();
        text.should.equal('Drop now to upload this file as first_attachment.');
      });
    });

    describe('dropping over an attachment with the same name', () => {
      testSingleFileUpload(attachmentName =>
        load('/projects/1/forms/f/draft', { root: false })
          .complete()
          .request(component =>
            dragAndDropOntoRow(component, attachmentName, attachmentName)));
    });

    describe('name mismatch modal', () => {
      beforeEach(() => {
        testData.extendedForms.createPast(1, { draft: true });
        testData.standardFormAttachments
          .createPast(1, { name: 'a', blobExists: true })
          .createPast(1, { name: 'b', blobExists: false });
      });

      it('is shown after the drop', async () => {
        const component = await load('/projects/1/forms/f/draft', {
          root: false
        });
        const modal = component.getComponent(FormAttachmentNameMismatch);
        modal.props().state.should.be.false;
        await dragAndDropOntoRow(component, 'a', 'mismatching_file');
        modal.props().state.should.be.true;
      });

      it('is hidden upon cancel', async () => {
        const component = await load('/projects/1/forms/f/draft', {
          root: false
        });
        await dragAndDropOntoRow(component, 'a', 'mismatching_file');
        const modal = component.getComponent(FormAttachmentNameMismatch);
        await modal.get('.btn-link').trigger('click');
        modal.props().state.should.be.false;
      });

      it('renders correctly for an existing attachment', async () => {
        const component = await load('/projects/1/forms/f/draft', {
          root: false
        });
        await dragAndDropOntoRow(component, 'a', 'mismatching_file');
        const modal = component.getComponent(FormAttachmentNameMismatch);
        modal.get('.modal-title').text().should.equal('Replace File');
      });

      it('renders correctly for a missing attachment', async () => {
        const component = await load('/projects/1/forms/f/draft', {
          root: false
        });
        await dragAndDropOntoRow(component, 'b', 'mismatching_file');
        const modal = component.getComponent(FormAttachmentNameMismatch);
        modal.get('.modal-title').text().should.equal('Upload File');
      });
    });

    describe('uploading after a name mismatch', () => {
      testSingleFileUpload(attachmentName =>
        load('/projects/1/forms/f/draft', { root: false })
          .complete()
          .request(async (component) => {
            await dragAndDropOntoRow(component, attachmentName, 'mismatching_file');
            const modal = component.getComponent(FormAttachmentNameMismatch);
            return modal.get('.btn-primary').trigger('click');
          }));
    });
  });

  describe('dataset linking', () => {
    it('sends a request for datasets if the project has one', () => {
      testData.extendedProjects.createPast(1, { forms: 2, datasets: 1 });
      testData.extendedDatasets.createPast(1);
      testData.extendedForms.createPast(1, { draft: true });
      testData.standardFormAttachments.createPast(1);
      return load('/projects/1/forms/f/draft', { root: false })
        .testRequestsInclude([{ url: '/v1/projects/1/datasets' }]);
    });

    it('renders correctly for an attachment linked to a dataset', async () => {
      testData.extendedProjects.createPast(1, { forms: 2, datasets: 1 });
      testData.extendedDatasets.createPast(1, { name: 'shovels' });
      testData.extendedForms.createPast(1, { draft: true });
      testData.standardFormAttachments.createPast(1, { type: 'file', name: 'shovels.csv', datasetExists: true });
      const component = await load('/projects/1/forms/f/draft', {
        root: false
      });

      const name = component.get('td.form-attachment-list-name');
      name.text().should.equal('shovels.csv');
      name.find('a').exists().should.be.false;
      await name.get('span').should.have.textTooltip();

      component.get('td.form-attachment-list-uploaded .dataset-label').text().should.equal('Linked to Entity List shovels');
      component.get('td.form-attachment-list-action').text().should.equal('Upload a file to override.');
    });

    describe('"Link Entity List" button', () => {
      beforeEach(() => {
        testData.extendedProjects.createPast(1, { forms: 2, datasets: 1 });
        testData.extendedDatasets.createPast(1, { name: 'shovels' });
        testData.extendedForms.createPast(1, { draft: true });
        testData.standardFormAttachments.createPast(1, { type: 'file', name: 'shovels.csv', blobExists: true });
      });

      it('shows the button if an attachment can be linked', async () => {
        const component = await load('/projects/1/forms/f/draft', {
          root: false
        });
        component.get('td.form-attachment-list-action .btn-link-dataset').exists().should.be.true;
      });

      it('updates the attachment after it is linked', () =>
        load('/projects/1/forms/f/draft', { root: false })
          .complete()
          .request(async (component) => {
            await component.get('td.form-attachment-list-action .btn-link-dataset').trigger('click');
            return component.get('#form-attachment-link-dataset .btn-link-dataset').trigger('click');
          })
          .respondWithData(() => testData.standardFormAttachments.update(0, {
            blobExists: false,
            datasetExists: true,
            hash: null
          }))
          .afterResponse(component => {
            component.get('td.form-attachment-list-uploaded .dataset-label').text().should.equal('Linked to Entity List shovels');
            component.get('td.form-attachment-list-action').text().should.equal('Upload a file to override.');
          }));
    });

    describe('linking after publishing new dataset', () => {
      it('shows "Link Entity List" after first dataset is published', () => {
        testData.extendedForms.createPast(1, { draft: true });
        // Create an attachment with the same name as the dataset that will be
        // published along with the form draft.
        testData.standardFormAttachments.createPast(1, {
          type: 'file',
          name: 'shovels.csv',
          blobExists: true
        });
        return load('/projects/1/forms/f/draft')
          .complete()
          .request(async (app) => {
            await app.get('#form-edit-publish-button').trigger('click');
            return app.get('#form-draft-publish .btn-primary').trigger('click');
          })
          .respondWithData(() => {
            testData.extendedFormDrafts.publish(-1);
            testData.extendedDatasets.createPast(1, { name: 'shovels' });
            testData.extendedProjects.update(-1, { datasets: 1, updatedAt: null });
            return { success: true };
          })
          .respondWithData(() => testData.extendedProjects.last())
          .respondWithData(() => testData.extendedForms.last())
          .respondWithData(() => testData.standardFormAttachments.sorted()) // publishedAttachments
          .respondWithData(() => testData.formDatasetDiffs.sorted())
          .complete()
          .request(app =>
            app.get('#form-edit-create-draft-button').trigger('click'))
          .respondWithData(() => {
            testData.extendedFormVersions.createNew({ draft: true });
            return { success: true };
          })
          .respondForComponent('FormEdit')
          // Now that a dataset has been published, a request should be sent for
          // `datasets`, even though one wasn't sent before.
          .testRequestsInclude([{ url: '/v1/projects/1/datasets' }])
          .afterResponses(app => {
            const button = app.find('.form-attachment-row .btn-link-dataset');
            button.exists().should.be.true;
          });
      });

      it('shows "Link Entity List" after another dataset is published', () => {
        testData.extendedProjects.createPast(1, { forms: 2, datasets: 1 });
        // There is an existing dataset named shovels. Publishing the form draft
        // will publish a new dataset named trees.
        testData.extendedDatasets.createPast(1, { name: 'shovels' });
        testData.extendedForms.createPast(1, { draft: true });
        testData.standardFormAttachments.createPast(1, {
          type: 'file',
          name: 'trees.csv',
          blobExists: true
        });
        return load('/projects/1/forms/f/draft')
          .complete()
          .request(async (app) => {
            await app.get('#form-edit-publish-button').trigger('click');
            return app.get('#form-draft-publish .btn-primary').trigger('click');
          })
          .respondWithData(() => {
            testData.extendedFormDrafts.publish(-1);
            testData.extendedDatasets.createPast(1, { name: 'trees' });
            testData.extendedProjects.update(-1, { datasets: 2, updatedAt: null });
            return { success: true };
          })
          .respondWithData(() => testData.extendedProjects.last())
          .respondWithData(() => testData.extendedForms.last())
          .respondWithData(() => testData.standardFormAttachments.sorted()) // publishedAttachments
          .respondWithData(() => testData.formDatasetDiffs.sorted())
          .complete()
          .request(app =>
            app.get('#form-edit-create-draft-button').trigger('click'))
          .respondWithData(() => {
            testData.extendedFormVersions.createNew({ draft: true });
            return { success: true };
          })
          .respondForComponent('FormEdit')
          .testRequestsInclude([{ url: '/v1/projects/1/datasets' }])
          .afterResponses(app => {
            const button = app.find('.form-attachment-row .btn-link-dataset');
            button.exists().should.be.true;
          });
      });
    });
  });
});

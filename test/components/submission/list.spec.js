import sinon from 'sinon';
import { nextTick } from 'vue';

import EnketoFill from '../../../src/components/enketo/fill.vue';
import SubmissionDataRow from '../../../src/components/submission/data-row.vue';
import SubmissionDownload from '../../../src/components/submission/download.vue';
import SubmissionMetadataRow from '../../../src/components/submission/metadata-row.vue';
import SubmissionDelete from '../../../src/components/submission/delete.vue';
import SubmissionRestore from '../../../src/components/submission/restore.vue';

import testData from '../../data';
import { changeMultiselect } from '../../util/trigger';
import { load } from '../../util/http';
import { loadSubmissionList } from '../../util/submission';
import { mockLogin } from '../../util/session';
import { relativeUrl } from '../../util/request';
import { testRouter } from '../../util/router';

// Create submissions along with the associated project and form.
const createSubmissions = (count, factoryOptions = {}) => {
  testData.extendedForms.createPast(1, { submissions: count });
  testData.extendedSubmissions.createPast(count, factoryOptions);
};

describe('SubmissionList', () => {
  beforeEach(mockLogin);

  describe('initial requests', () => {
    it('sends the correct requests for a form', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a b' });
      return loadSubmissionList().testRequests([
        { url: '/v1/projects/1/forms/a%20b/fields?odata=true' },
        { url: '/v1/projects/1/forms/a%20b/submissions/submitters' },
        {
          url: ({ pathname }) => {
            pathname.should.equal('/v1/projects/1/forms/a%20b.svc/Submissions');
          }
        }
      ]);
    });

    it('sends the correct requests for a form draft', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a b', draft: true });
      return loadSubmissionList().testRequests([
        { url: '/v1/projects/1/forms/a%20b/draft/fields?odata=true' },
        {
          url: ({ pathname }) => {
            pathname.should.equal('/v1/projects/1/forms/a%20b/draft.svc/Submissions');
          }
        }
      ]);
    });
  });

  it('shows the "Test in browser" button for a form draft', async () => {
    testData.extendedForms.createPast(1, { draft: true });
    const component = await loadSubmissionList();
    const actions = component.get('#submission-list-actions');
    actions.findComponent(EnketoFill).exists().should.be.true;
  });

  it('shows a message if there are no submissions', () => {
    testData.extendedForms.createPast(1);
    return loadSubmissionList().then(component => {
      component.get('.empty-table-message').should.be.visible();
    });
  });

  describe('after the refresh button is clicked', () => {
    it('completes a background refresh', () => {
      const clock = sinon.useFakeTimers(Date.now());
      let initialTime;
      testData.extendedSubmissions.createPast(1);
      const assertRowCount = (count) => (component, _, i) => {
        if (i === 0 || i == null) {
          component.findAllComponents(SubmissionMetadataRow).length.should.equal(count);
          component.findAllComponents(SubmissionDataRow).length.should.equal(count);
        }
      };
      return load('/projects/1/forms/f/submissions', { root: false })
        .afterResponses((component) => {
          assertRowCount(1)(component);
          initialTime = component.get('.table-refresh-bar span').text();
        })
        .request((component) => {
          clock.tick(1000);
          return component.get('#refresh-button').trigger('click');
        })
        .beforeEachResponse(assertRowCount(1))
        .respondWithData(() => {
          testData.extendedSubmissions.createNew();
          return testData.submissionOData();
        })
        .respondWithData(() => testData.submissionDeletedOData())
        .afterResponse((component) => {
          assertRowCount(2)(component);

          const newTime = component.get('.table-refresh-bar span').text();
          newTime.should.not.equal(initialTime);
        });
    });

    it('does not show a loading message', () => {
      testData.extendedSubmissions.createPast(1);
      return loadSubmissionList()
        .complete()
        .request(component =>
          component.get('#refresh-button').trigger('click'))
        .beforeEachResponse(component => {
          component.get('#odata-loading-message').should.be.hidden();
        })
        .respondWithData(testData.submissionOData);
    });

    it('should show correct row number after refresh', () => {
      testData.extendedSubmissions.createPast(1);
      return loadSubmissionList()
        .complete()
        .request(component =>
          component.get('#refresh-button').trigger('click'))
        .beforeEachResponse(component => {
          testData.extendedSubmissions.createPast(1);
          component.get('#odata-loading-message').should.be.hidden();
        })
        .respondWithData(testData.submissionOData)
        .afterResponse(component => {
          component.findAllComponents(SubmissionMetadataRow).forEach((r, i) => {
            r.props().rowNumber.should.be.equal(2 - i);
          });
        });
    });
  });

  describe('refreshing keys', () => {
    it('opens modal with encrpytion password after refreshing keys', () => {
      // create project with managed encryption, form, and 0 submissions to start
      testData.extendedProjects.createPast(1, {
        key: testData.standardKeys.createPast(1, { managed: true }).last()
      });
      testData.extendedForms.createPast(1);
      return load('/projects/1/forms/f/submissions', { root: false }, {
        keys: () => [] // if there are 0 submissions, backend returns empty key array
      })
        .complete()
        .request(async (app) => {
          await app.get('#submission-download-button').trigger('click');
          const modal = app.getComponent(SubmissionDownload);
          await modal.find('input[type="password"]').exists().should.be.false;
          return app.get('#refresh-button').trigger('click');
        })
        .beforeAnyResponse(() => {
          testData.extendedSubmissions.createPast(1, { status: 'notDecrypted' });
        })
        .respondWithData(() => testData.submissionOData(1, 0))
        .respondWithData(() => testData.submissionDeletedOData())
        .respondWithData(() => testData.standardKeys.sorted())
        .complete()
        .request(async (app) => {
          await app.get('#submission-download-button').trigger('click');
          const modal = app.getComponent(SubmissionDownload);
          await modal.find('input[type="password"]').exists().should.be.true;
        });
    });

    it('sends request for encryption keys on draft/testing submission refresh', () => {
      // create project with managed encryption, form, and 0 submissions to start
      testData.extendedProjects.createPast(1, {
        key: testData.standardKeys.createPast(1, { managed: true }).last(),
        forms: 1
      });
      testData.extendedForms.createPast(1, { xmlFormId: 'e', draft: true });
      return load('/projects/1/forms/e/draft', { root: false }, {
        keys: () => [] // if there are 0 submissions, backend returns empty key array
      })
        .complete()
        .request(component =>
          component.get('#refresh-button').trigger('click'))
        .beforeAnyResponse(() => {
          testData.extendedSubmissions.createPast(1, { status: 'notDecrypted' });
        })
        .respondWithData(() => testData.submissionOData(1, 0))
        .respondWithData(() => testData.standardKeys.sorted())
        .testRequestsInclude([{
          url: '/v1/projects/1/forms/e/draft/submissions/keys'
        }]);
    });

    it('sends request for encryption keys on published submission refresh', () => {
      // create project with managed encryption, form, and 0 submissions to start
      testData.extendedProjects.createPast(1, {
        key: testData.standardKeys.createPast(1, { managed: true }).last()
      });
      testData.extendedForms.createPast(1);
      return load('/projects/1/forms/f/submissions', { root: false }, {
        keys: () => [] // if there are 0 submissions, backend returns empty key array
      })
        .complete()
        .request(component =>
          component.get('#refresh-button').trigger('click'))
        .beforeAnyResponse(() => {
          testData.extendedSubmissions.createPast(1, { status: 'notDecrypted' });
        })
        .respondWithData(() => testData.submissionOData(1, 0))
        .respondWithData(() => testData.submissionDeletedOData())
        .respondWithData(() => testData.standardKeys.sorted())
        .testRequests([
          null,
          null,
          { url: '/v1/projects/1/forms/f/submissions/keys' }
        ]);
    });
  });

  describe('$select query parameter', () => {
    // Create a form with 20 string fields. The first string field is in a
    // group.
    beforeEach(() => {
      const { group, string } = testData.fields;
      const fields = [group('/g'), string('/g/s1')];
      for (let i = 2; i <= 20; i += 1) fields.push(string(`/s${i}`));
      testData.extendedForms.createPast(1, { fields });
    });

    const $select = (url) => relativeUrl(url).searchParams.get('$select');

    it('does not specify $select for the first chunk of submissions', () =>
      loadSubmissionList().beforeEachResponse((_, { url }) => {
        if (url.includes('.svc/Submissions')) should.not.exist($select(url));
      }));

    // eslint-disable-next-line func-names
    it('specifies $select if the next button is clicked', function() {
      this.timeout(20 * 1000);
      testData.extendedSubmissions.createPast(251);
      return loadSubmissionList()
        .complete()
        .request(component => {
          component.get('button[aria-label="Next page"]').trigger('click');
        })
        .beforeEachResponse((_, { url }) => {
          $select(url).should.equal('__id,__system,g/s1,s2,s3,s4,s5,s6,s7,s8,s9,s10');
        })
        .respondWithData(() => testData.submissionOData(1, 0));
    });

    it('specifies $select if the refresh button is clicked', () =>
      loadSubmissionList()
        .complete()
        .request(component =>
          component.get('#refresh-button').trigger('click'))
        .beforeEachResponse((_, { url }) => {
          $select(url).should.equal('__id,__system,g/s1,s2,s3,s4,s5,s6,s7,s8,s9,s10');
        })
        .respondWithData(() => testData.submissionOData(1, 0)));

    it('specifies $select if a filter is changed', () =>
      load('/projects/1/forms/f/submissions', { attachTo: document.body })
        .complete()
        .request(changeMultiselect('#submission-filters-review-state', [0]))
        .beforeEachResponse((_, { url }) => {
          $select(url).should.equal('__id,__system,g/s1,s2,s3,s4,s5,s6,s7,s8,s9,s10');
        })
        .respondWithData(testData.submissionOData));

    it('specifies correct $select parameter if different field is selected', () =>
      loadSubmissionList({ attachTo: document.body })
        .complete()
        .request(changeMultiselect('#submission-field-dropdown', [19]))
        .beforeEachResponse((_, { url }) => {
          $select(url).should.equal('__id,__system,s20');
        })
        .respondWithData(testData.submissionOData));

    it('specifies correct $select parameter if all fields are deselected', () =>
      loadSubmissionList({ attachTo: document.body })
        .complete()
        .request(changeMultiselect('#submission-field-dropdown', []))
        .beforeEachResponse((_, { url }) => {
          $select(url).should.equal('__id,__system');
        })
        .respondWithData(testData.submissionOData));
  });

  describe('deleted submissions', () => {
    it('show deleted submissions', () => {
      testData.extendedSubmissions.createPast(1, { meta: { instanceName: 'live' } });
      testData.extendedSubmissions.createPast(1, { meta: { instanceName: 'deleted 1' }, deletedAt: new Date().toISOString() });
      testData.extendedSubmissions.createPast(1, { meta: { instanceName: 'deleted 2' }, deletedAt: new Date().toISOString() });
      return loadSubmissionList({ props: { deleted: true } })
        .afterResponse(component => {
          component.findAll('.table-freeze-scrolling tbody tr').length.should.be.equal(2);
          component.findAll('.table-freeze-scrolling tbody tr').forEach((r, i) => {
            r.find('td').text().should.be.equal(`deleted ${2 - i}`);
          });
        });
    });

    it('emits event to refresh deleted count when live submissions are on display', () => {
      testData.extendedSubmissions.createPast(1);
      return loadSubmissionList()
        .complete()
        .request(component =>
          component.get('#refresh-button').trigger('click'))
        .respondWithData(testData.submissionOData)
        .afterResponse(component => {
          component.emitted().should.have.property('fetch-deleted-count');
        });
    });

    it('updates the deleted count', () => {
      testData.extendedSubmissions.createPast(1, { deletedAt: new Date().toISOString() });
      return load('/projects/1/forms/f/submissions', { root: false, container: { router: testRouter() } })
        .complete()
        .request(component =>
          component.get('.toggle-deleted-submissions').trigger('click'))
        .respondWithData(testData.submissionDeletedOData)
        .afterResponses((component) => {
          component.find('.toggle-deleted-submissions').text().should.equal('1 deleted Submission');
          component.findAll('.table-freeze-scrolling tbody tr').length.should.be.equal(1);
        })
        .request(component =>
          component.get('#refresh-button').trigger('click'))
        .beforeAnyResponse(() => {
          testData.extendedSubmissions.createPast(1, { deletedAt: new Date().toISOString() });
        })
        .respondWithData(testData.submissionDeletedOData)
        .afterResponses((component) => {
          component.find('.toggle-deleted-submissions').text().should.equal('2 deleted Submissions');
          component.findAll('.table-freeze-scrolling tbody tr').length.should.be.equal(2);
        });
    });

    it('disables filters', () => {
      testData.extendedSubmissions.createPast(1, { meta: { instanceName: 'live' } });
      testData.extendedSubmissions.createPast(1, { meta: { instanceName: 'deleted 1' }, deletedAt: new Date().toISOString() });
      testData.extendedSubmissions.createPast(1, { meta: { instanceName: 'deleted 2' }, deletedAt: new Date().toISOString() });
      return loadSubmissionList({ props: { deleted: true } })
        .afterResponse(component => {
          component.getComponent('#submission-filters').props().disabled.should.be.true;
        });
    });

    it('disables download button', () => {
      testData.extendedSubmissions.createPast(1, { deletedAt: new Date().toISOString() });
      return load('/projects/1/forms/f/submissions', { root: false, container: { router: testRouter() } })
        .complete()
        .request(component =>
          component.get('.toggle-deleted-submissions').trigger('click'))
        .respondWithData(testData.submissionDeletedOData)
        .afterResponses((component) => {
          component.find('#submission-download-button').attributes('aria-disabled').should.equal('true');
        });
    });

    it('disables map view', () => {
      const { geopoint } = testData.fields;
      const fields = [geopoint('/the_place')];
      testData.extendedForms.createPast(1, { fields });

      testData.extendedSubmissions.createPast(1, { deletedAt: new Date().toISOString() });
      return load('/projects/1/forms/f/submissions', { root: false, container: { router: testRouter() } })
        .complete()
        .request(component =>
          component.get('.toggle-deleted-submissions').trigger('click'))
        .respondWithData(testData.submissionDeletedOData)
        .afterResponses((component) => {
          component.getComponent('.radio-field').props().disabled.should.be.true;
        });
    });
  });

  describe('delete', () => {
    it('toggles the modal', () => {
      testData.extendedSubmissions.createPast(1);
      return load('/projects/1/forms/f/submissions', { root: false })
        .complete()
        .testModalToggles({
          modal: SubmissionDelete,
          show: '.submission-metadata-row .delete-button',
          hide: '.btn-link'
        });
    });

    it('implements some standard button things', () => {
      testData.extendedSubmissions.createPast(1);
      return load('/projects/1/forms/f/submissions', { root: false })
        .afterResponses(component =>
          component.get('.submission-metadata-row .delete-button').trigger('click'))
        .testStandardButton({
          button: '#submission-delete .btn-danger',
          disabled: ['#submission-delete .btn-link'],
          modal: SubmissionDelete
        });
    });

    it('sends the correct request', () => {
      const { instanceId } = testData.extendedSubmissions.createPast(1).last();
      return load('/projects/1/forms/f/submissions', { root: false })
        .complete()
        .request(async (component) => {
          await component.get('.submission-metadata-row .delete-button').trigger('click');
          return component.get('#submission-delete .btn-danger').trigger('click');
        })
        .respondWithProblem()
        .testRequests([{
          method: 'DELETE',
          url: `/v1/projects/1/forms/f/submissions/${instanceId}`
        }]);
    });

    describe('after a successful response', () => {
      const del = () => {
        testData.extendedSubmissions.createPast(1);
        return load('/projects/1/forms/f/submissions')
          .complete()
          .request(async (component) => {
            await component.get('.submission-metadata-row .delete-button').trigger('click');
            return component.get('#submission-delete .btn-danger').trigger('click');
          })
          .respondWithSuccess();
      };

      it('hides the modal', async () => {
        const component = await del();
        component.getComponent(SubmissionDelete).props().state.should.be.false;
      });

      it('shows a success alert', async () => {
        const component = await del();
        component.should.alert('success', 'Submission has been successfully deleted.');
      });

      it('removes the row', async () => {
        const component = await del();
        const row = component.findComponent(SubmissionMetadataRow);
        row.exists().should.be.false;
      });

      it('updates the submission count', async () => {
        const component = await del();
        const text = component.get('#page-head-tabs li:nth-of-type(1)').text();
        text.should.equal('Submissions 0');
      });

      it('shows deleted submission button', async () => {
        const component = await del();
        component.get('.toggle-deleted-submissions').should.be.visible();
      });
    });

    it('shows a success alert even when backend returns 404', async () => {
      testData.extendedSubmissions.createPast(1);
      const component = await load('/projects/1/forms/f/submissions')
        .complete()
        .request(async (c) => {
          await c.get('.submission-metadata-row .delete-button').trigger('click');
          return c.get('#submission-delete .btn-danger').trigger('click');
        })
        .respondWithProblem(404.1);

      component.should.alert('success', 'Submission has been successfully deleted.');
    });

    describe('last submission was deleted', () => {
      beforeEach(() => {
        testData.extendedSubmissions.createPast(2);
      });

      const del = (index) => async (component) => {
        const row = component.get(`.submission-metadata-row:nth-child(${index + 1})`);
        await row.get('.delete-button').trigger('click');
        return component.get('#submission-delete .btn-danger').trigger('click');
      };

      it('hides the table', () =>
        load('/projects/1/forms/f/submissions', { root: false, attachTo: document.body })
          .complete()
          .request(del(1))
          .respondWithSuccess()
          .afterResponse(async component => {
            component.get('#submission-table table').should.be.visible(true);
          })
          .request(del(0))
          .respondWithSuccess()
          .afterResponse(async component => {
            component.get('#submission-table table').should.be.hidden(true);
          }));

      it('shows a message', () =>
        load('/projects/1/forms/f/submissions', { root: false, attachTo: document.body })
          .complete()
          .request(del(1))
          .respondWithSuccess()
          .afterResponse(component => {
            component.get('.empty-table-message').should.be.hidden();
          })
          .request(del(0))
          .respondWithSuccess()
          .afterResponse(component => {
            component.get('.empty-table-message').should.be.visible();
          }));
    });

    it('continues to show modal if checkbox was not checked', () => {
      testData.extendedSubmissions.createPast(2);
      return load('/projects/1/forms/f/submissions', { root: false })
        .complete()
        .request(async (component) => {
          const row = component.get('.submission-metadata-row:last-child');
          await row.get('.delete-button').trigger('click');
          return component.get('#submission-delete .btn-danger').trigger('click');
        })
        .respondWithSuccess()
        .afterResponse(async (component) => {
          await component.get('.submission-metadata-row .delete-button').trigger('click');
          component.getComponent(SubmissionDelete).props().state.should.be.true;
        });
    });

    describe('deleting after checking the checkbox', () => {
      const delAndCheck = () => {
        testData.extendedSubmissions
          .createPast(1, { instanceId: 'e1' })
          .createPast(1, { instanceId: 'e2' });
        return load('/projects/1/forms/f/submissions', { root: false })
          .complete()
          .request(async (component) => {
            const row = component.get('.submission-metadata-row:last-child');
            await row.get('.delete-button').trigger('click');
            const modal = component.getComponent(SubmissionDelete);
            await modal.get('input').setChecked();
            return modal.get('.btn-danger').trigger('click');
          })
          .respondWithSuccess()
          .complete();
      };

      it('immediately sends a request', () =>
        delAndCheck()
          .request(component =>
            component.get('.submission-metadata-row .delete-button').trigger('click'))
          .respondWithProblem()
          .testRequests([{
            method: 'DELETE',
            url: '/v1/projects/1/forms/f/submissions/e2'
          }]));

      it('does not show the modal', () =>
        delAndCheck()
          .request(async (component) => {
            await component.get('.submission-metadata-row .delete-button').trigger('click');
            component.getComponent(SubmissionDelete).props().state.should.be.false;
          })
          .respondWithProblem());

      it('shows spinner', () =>
        delAndCheck()
          .request(async (component) => {
            await component.get('.submission-metadata-row .delete-button').trigger('click');
            component.getComponent(SubmissionDelete).props().state.should.be.false;
          })
          .beforeAnyResponse(component => {
            component.find('.delete-button .spinner').classes().should.contain('active');
          })
          .respondWithSuccess()
          .afterResponse(component => {
            component.find('tbody tr').exists().should.be.false;
          }));

      it('shows the correct alert', () =>
        delAndCheck()
          .request(component =>
            component.get('.submission-metadata-row .delete-button').trigger('click'))
          .respondWithSuccess()
          .afterResponse(component => {
            component.should.alert('success', 'Submission has been successfully deleted.');
          }));

      it('cancels a background refresh', () =>
        delAndCheck()
          .request(async (component) => {
            const { odata } = component.vm.$container.requestData.localResources;
            sinon.spy(odata, 'cancelRequest');
            await component.get('#refresh-button').trigger('click');
            return component.get('.submission-metadata-row .delete-button').trigger('click');
          })
          .respondWithData(testData.submissionOData)
          .respondWithData(testData.submissionDeletedOData)
          .respondWithSuccess()
          .afterResponses(component => {
            const { odata } = component.vm.$container.requestData.localResources;
            odata.cancelRequest.called.should.be.true;
          }));
    });
  });

  describe('restore', () => {
    const loadDeletedSubmissions = () => {
      testData.extendedSubmissions.createPast(1, { instanceId: 'e', deletedAt: new Date().toISOString() });
      return load('/projects/1/forms/f/submissions?deleted=true', { root: false }, {
        deletedSubmissionCount: false
      });
    };

    it('toggles the modal', () => loadDeletedSubmissions()
      .complete()
      .testModalToggles({
        modal: SubmissionRestore,
        show: '.submission-metadata-row .restore-button',
        hide: '.btn-link'
      }));

    it('implements some standard button things', () => loadDeletedSubmissions()
      .afterResponses(component =>
        component.get('.submission-metadata-row .restore-button').trigger('click'))
      .testStandardButton({
        button: '#submission-restore .btn-danger',
        disabled: ['#submission-restore .btn-link'],
        modal: SubmissionRestore
      }));

    it('sends the correct request', () => loadDeletedSubmissions()
      .complete()
      .request(async (component) => {
        await component.get('.submission-metadata-row .restore-button').trigger('click');
        return component.get('#submission-restore .btn-danger').trigger('click');
      })
      .respondWithProblem()
      .testRequests([{
        method: 'POST',
        url: '/v1/projects/1/forms/f/submissions/e/restore'
      }]));

    describe('after a successful response', () => {
      const restore = () => loadDeletedSubmissions()
        .complete()
        .request(async (component) => {
          await component.get('.submission-metadata-row .restore-button').trigger('click');
          return component.get('#submission-restore .btn-danger').trigger('click');
        })
        .respondWithSuccess();

      it('hides the modal', async () => {
        const component = await restore();
        component.getComponent(SubmissionRestore).props().state.should.be.false;
      });

      it('shows a success alert', async () => {
        const component = await restore();
        component.should.alert('success', 'The Submission has been restored.');
      });

      it('hides the row', async () => {
        const component = await restore();
        const row = component.findComponent(SubmissionMetadataRow);
        row.exists().should.be.false;
      });

      it('updates the submission count', async () => {
        const component = await restore();
        const text = component.get('.toggle-deleted-submissions').text();
        text.should.equal('0 deleted Submissions');
      });
    });

    it('shows a success alert even when backend returns 404', async () => {
      const component = await loadDeletedSubmissions()
        .complete()
        .request(async (c) => {
          await c.get('.submission-metadata-row .restore-button').trigger('click');
          return c.get('#submission-restore .btn-danger').trigger('click');
        })
        .respondWithProblem(404.1);

      component.should.alert('success', 'The Submission has been restored.');
    });

    describe('last submission was restored', () => {
      beforeEach(() => {
        testData.extendedSubmissions.createPast(2, { deletedAt: new Date().toISOString() });
      });

      const restore = (index) => async (component) => {
        const row = component.get(`.submission-metadata-row:nth-child(${index + 1})`);
        await row.get('.restore-button').trigger('click');
        return component.get('#submission-restore .btn-danger').trigger('click');
      };

      it('hides the table', () =>
        load('/projects/1/forms/f/submissions?deleted=true', { root: false, attachTo: document.body }, {
          deletedSubmissionCount: false
        })
          .complete()
          .request(restore(1))
          .respondWithSuccess()
          .afterResponse(component => {
            component.get('#submission-table table').should.be.visible(true);
          })
          .request(restore(0))
          .respondWithSuccess()
          .afterResponse(component => {
            component.get('#submission-table table').should.be.hidden(true);
          }));

      it('shows a message', () =>
        load('/projects/1/forms/f/submissions?deleted=true', { root: false }, {
          deletedSubmissionCount: false
        })
          .complete()
          .request(restore(1))
          .respondWithSuccess()
          .afterResponse(component => {
            component.get('.empty-table-message').should.be.hidden();
          })
          .request(restore(0))
          .respondWithSuccess()
          .afterResponse(component => {
            component.get('.empty-table-message').should.be.visible();
            component.get('.empty-table-message').text().should.be.equal('All deleted Submissions are restored.');
          }));
    });

    it('continues to show modal if checkbox was not checked', () => {
      testData.extendedSubmissions.createPast(2, { deletedAt: new Date().toISOString() });
      return load('/projects/1/forms/f/submissions?deleted=true', { root: false }, {
        deletedSubmissionCount: false
      })
        .complete()
        .request(async (component) => {
          const row = component.get('.submission-metadata-row:last-child');
          await row.get('.restore-button').trigger('click');
          return component.get('#submission-restore .btn-danger').trigger('click');
        })
        .respondWithSuccess()
        .afterResponse(async (component) => {
          await component.get('.submission-metadata-row .restore-button').trigger('click');
          component.getComponent(SubmissionRestore).props().state.should.be.true;
        });
    });

    describe('undeleting after checking the checkbox', () => {
      const restoreAndCheck = () => {
        testData.extendedSubmissions
          .createPast(1, { instanceId: 'e1', deletedAt: new Date().toISOString() })
          .createPast(1, { instanceId: 'e2', deletedAt: new Date().toISOString() });
        return load('/projects/1/forms/f/submissions?deleted=true', { root: false }, {
          deletedSubmissionCount: false
        })
          .complete()
          .request(async (component) => {
            const row = component.get('.submission-metadata-row:last-child');
            await row.get('.restore-button').trigger('click');
            const modal = component.getComponent(SubmissionRestore);
            await modal.get('input').setChecked();
            return modal.get('.btn-danger').trigger('click');
          })
          .respondWithSuccess()
          .complete();
      };

      it('immediately sends a request', () =>
        restoreAndCheck()
          .request(component =>
            component.get('.submission-metadata-row .restore-button').trigger('click'))
          .respondWithProblem()
          .testRequests([{
            method: 'POST',
            url: '/v1/projects/1/forms/f/submissions/e2/restore'
          }]));

      it('does not show the modal', () =>
        restoreAndCheck()
          .request(async (component) => {
            await component.get('.submission-metadata-row .restore-button').trigger('click');
            component.getComponent(SubmissionRestore).props().state.should.be.false;
          })
          .respondWithProblem());

      it('shows spinner', () =>
        restoreAndCheck()
          .request(async (component) => {
            await component.get('.submission-metadata-row .restore-button').trigger('click');
            component.getComponent(SubmissionDelete).props().state.should.be.false;
          })
          .beforeAnyResponse(component => {
            component.find('.restore-button .spinner').classes().should.contain('active');
          })
          .respondWithSuccess()
          .afterResponse(component => {
            component.find('tbody tr').exists().should.be.false;
          }));

      it('shows the correct alert', () =>
        restoreAndCheck()
          .request(component =>
            component.get('.submission-metadata-row .restore-button').trigger('click'))
          .respondWithSuccess()
          .afterResponse(component => {
            component.should.alert('success', 'The Submission has been restored.');
          }));

      it('cancels a background refresh', () =>
        restoreAndCheck()
          .request(async (component) => {
            const { odata } = component.vm.$container.requestData.localResources;
            sinon.spy(odata, 'cancelRequest');
            await component.get('#refresh-button').trigger('click');
            return component.get('.submission-metadata-row .restore-button').trigger('click');
          })
          .respondWithData(testData.submissionDeletedOData)
          .respondWithSuccess()
          .afterResponses(component => {
            const { odata } = component.vm.$container.requestData.localResources;
            odata.cancelRequest.called.should.be.true;
          }));
    });
  });

  describe('pagination', function() { // eslint-disable-line func-names
    this.timeout(4000);

    const checkIds = (component, count, offset = 0) => {
      const rows = component.findAllComponents(SubmissionDataRow);
      rows.length.should.equal(count);
      const submissions = testData.extendedSubmissions.sorted();
      submissions.length.should.be.at.least(count + offset);
      for (let i = 0; i < rows.length; i += 1) {
        const text = rows[i].get('td:last-child').text();
        text.should.equal(submissions[i + offset].instanceId);
      }
    };

    it('should load all submission if there are less than page size', async () => {
      createSubmissions(3);
      const component = await loadSubmissionList();
      checkIds(component, 3);
    });

    it('should load next page', async () => {
      createSubmissions(251);
      return loadSubmissionList()
        .complete()
        .request(component =>
          component.find('button[aria-label="Next page"]').trigger('click'))
        .respondWithData(() => testData.submissionOData(250, 250))
        .afterResponse(component => {
          checkIds(component, 1, 250);
        });
    });

    it('should load previous page', async () => {
      createSubmissions(251);
      const clock = sinon.useFakeTimers();
      return loadSubmissionList()
        .complete()
        .request(component =>
          component.find('button[aria-label="Next page"]').trigger('click'))
        .respondWithData(() => testData.submissionOData(250, 250))
        .complete()
        .request(component =>
          component.find('button[aria-label="Previous page"]').trigger('click'))
        .respondWithData(() => testData.submissionOData(250))
        .afterResponse(async component => {
          // we still use chunky array which load 25 rows at a time
          clock.tick(1000);
          await nextTick();
          checkIds(component, 250);
        });
    });

    it('should change the page size', async () => {
      createSubmissions(251);
      const clock = sinon.useFakeTimers();
      return loadSubmissionList()
        .complete()
        .request(component => {
          const sizeDropdown = component.find('.pagination select:has(option[value="500"])');
          return sizeDropdown.setValue(500);
        })
        .respondWithData(() => testData.submissionOData(500))
        .afterResponse(async component => {
          clock.tick(1000);
          await nextTick();
          checkIds(component, 251);
        });
    });

    it('should load first page on refresh', async () => {
      createSubmissions(251);
      const clock = sinon.useFakeTimers();
      return loadSubmissionList()
        .complete()
        .request(component =>
          component.find('button[aria-label="Next page"]').trigger('click'))
        .respondWithData(() => testData.submissionOData(250, 250))
        .complete()
        .request(component =>
          component.get('#refresh-button').trigger('click'))
        .respondWithData(() => testData.submissionOData(250))
        .afterResponse(async component => {
          // we still use chunky array which load 25 rows at a time
          clock.tick(1000);
          await nextTick();
          checkIds(component, 250);
        });
    });

    it('should show correct row number', () => {
      createSubmissions(251);
      const clock = sinon.useFakeTimers();
      return loadSubmissionList()
        .afterResponse(async component => {
          clock.tick(1000);
          await nextTick();
          const rows = component.findAllComponents(SubmissionMetadataRow);
          rows[0].find('.row-number').text().should.be.eql('251');
          rows[249].find('.row-number').text().should.be.eql('2');
          rows.length.should.be.eql(250);
        })
        .request(component =>
          component.find('button[aria-label="Next page"]').trigger('click'))
        .respondWithData(() => testData.submissionOData(250, 250))
        .afterResponse(component => {
          const rows = component.findAllComponents(SubmissionMetadataRow);
          rows[0].find('.row-number').text().should.be.eql('1');
        });
    });

    it('should load correct page on clicking next twice', () => {
      createSubmissions(501);
      return loadSubmissionList()
        .complete()
        .request(async component => {
          await component.find('button[aria-label="Next page"]').trigger('click');
          component.find('button[aria-label="Next page"]').trigger('click');
        })
        .respondWithData(() => testData.submissionOData(250, 250))
        .respondWithData(() => testData.submissionOData(250, 500))
        .afterResponses(async component => {
          await nextTick();
          checkIds(component, 1, 500);
          component.find('.pagination select').element.value.should.be.eql('2');
        });
    });
  });
});

import EnketoFill from '../../../src/components/enketo/fill.vue';
import Spinner from '../../../src/components/spinner.vue';
import SubmissionDataRow from '../../../src/components/submission/data-row.vue';
import SubmissionDownload from '../../../src/components/submission/download.vue';
import SubmissionList from '../../../src/components/submission/list.vue';
import SubmissionMetadataRow from '../../../src/components/submission/metadata-row.vue';
import SubmissionDelete from '../../../src/components/submission/delete.vue';
import SubmissionRestore from '../../../src/components/submission/restore.vue';

import testData from '../../data';
import { changeMultiselect } from '../../util/trigger';
import { load } from '../../util/http';
import { loadSubmissionList } from '../../util/submission';
import { mockLogin } from '../../util/session';
import { mockResponse } from '../../util/axios';
import { relativeUrl } from '../../util/request';
import { testRouter } from '../../util/router';

// Create submissions along with the associated project and form.
const createSubmissions = (count, factoryOptions = {}) => {
  testData.extendedForms.createPast(1, { submissions: count });
  testData.extendedSubmissions.createPast(count, factoryOptions);
};
const _scroll = (component, scrolledToBottom) => {
  const method = component.vm.scrolledToBottom;
  if (method == null) {
    _scroll(component.getComponent(SubmissionList), scrolledToBottom);
    return;
  }
  // eslint-disable-next-line no-param-reassign
  component.vm.scrolledToBottom = () => scrolledToBottom;
  document.dispatchEvent(new Event('scroll'));
  // eslint-disable-next-line no-param-reassign
  component.vm.scrolledToBottom = method;
};
// eslint-disable-next-line consistent-return
const scroll = (componentOrBoolean) => {
  if (componentOrBoolean === true || componentOrBoolean === false)
    return (component) => _scroll(component, componentOrBoolean);
  _scroll(componentOrBoolean, true);
};

describe('SubmissionList', () => {
  beforeEach(mockLogin);

  describe('initial requests', () => {
    it('sends the correct requests for a form', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a b' });
      let count = 0;
      return loadSubmissionList()
        .beforeEachResponse((_, { url }, i) => {
          count += 1;
          if (i === 0)
            url.should.equal('/v1/projects/1/forms/a%20b/fields?odata=true');
          else if (i === 1)
            url.should.startWith('/v1/projects/1/forms/a%20b.svc/Submissions?');
          else
            url.should.equal('/v1/projects/1/forms/a%20b/submissions/submitters');
        })
        .afterResponses(() => {
          count.should.equal(3);
        });
    });

    it('sends the correct requests for a form draft', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a b', draft: true });
      let count = 0;
      return loadSubmissionList()
        .beforeEachResponse((_, { url }, i) => {
          count += 1;
          if (i === 0)
            url.should.equal('/v1/projects/1/forms/a%20b/draft/fields?odata=true');
          else
            url.should.startWith('/v1/projects/1/forms/a%20b/draft.svc/Submissions?');
        })
        .afterResponses(() => {
          count.should.equal(2);
        });
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
      testData.extendedSubmissions.createPast(1);
      const assertRowCount = (count, responseIndex = 0) => (component, _, i) => {
        if (i === responseIndex) {
          component.findAllComponents(SubmissionMetadataRow).length.should.equal(count);
          component.findAllComponents(SubmissionDataRow).length.should.equal(count);
        }
      };
      return load('/projects/1/forms/f/submissions', { root: false })
        .afterResponses(assertRowCount(1))
        .request(component =>
          component.get('#submission-list-refresh-button').trigger('click'))
        .beforeEachResponse(assertRowCount(1))
        .respondWithData(() => {
          testData.extendedSubmissions.createNew();
          return testData.submissionOData();
        })
        .respondWithData(() => testData.submissionDeletedOData())
        .afterResponse(assertRowCount(2));
    });

    it('does not show a loading message', () => {
      testData.extendedSubmissions.createPast(1);
      return loadSubmissionList()
        .complete()
        .request(component =>
          component.get('#submission-list-refresh-button').trigger('click'))
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
          component.get('#submission-list-refresh-button').trigger('click'))
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

  describe('load by chunk', () => {
    const checkTop = ({ url }, top) => {
      url.should.match(new RegExp(`[?&]%24top=${top}(&|$)`));
    };
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
    const checkMessage = (component, text) => {
      const message = component.get('#odata-loading-message');
      if (text == null) {
        message.should.be.hidden();
      } else {
        message.should.not.be.hidden();
        message.get('#odata-loading-message-text').text().should.equal(text);

        const spinner = component.findAllComponents(Spinner).find(wrapper =>
          message.element.contains(wrapper.element));
        spinner.props().state.should.be.true;
      }
    };

    it('loads a single submission', () => {
      createSubmissions(1);
      return loadSubmissionList()
        .beforeEachResponse((component, { url }) => {
          if (url.includes('.svc/Submissions'))
            checkMessage(component, 'Loading 1 Submission…');
        });
    });

    it('loads all submissions if there are few of them', () => {
      createSubmissions(2);
      return loadSubmissionList()
        .beforeEachResponse((component, { url }) => {
          if (url.includes('.svc/Submissions'))
            checkMessage(component, 'Loading 2 Submissions…');
        });
    });

    it('initially loads only the first chunk if there are many submissions', () => {
      createSubmissions(3);
      return loadSubmissionList({
        props: { top: () => 2 }
      })
        .beforeEachResponse((component, config) => {
          if (config.url.includes('.svc/Submissions')) {
            checkMessage(component, 'Loading the first 2 of 3 Submissions…');
            checkTop(config, 2);
          }
        })
        .afterResponses(component => {
          checkIds(component, 2);
        });
    });

    it('clicking refresh button loads only first chunk of submissions', () => {
      createSubmissions(3);
      return loadSubmissionList({
        props: { top: () => 2 }
      })
        .complete()
        .request(component =>
          component.get('#submission-list-refresh-button').trigger('click'))
        .beforeEachResponse((_, config) => {
          checkTop(config, 2, 0);
        })
        .respondWithData(() => testData.submissionOData(2, 0))
        .afterResponse(component => {
          checkIds(component, 2);
        });
    });

    describe('scrolling', () => {
      it('scrolling to the bottom loads the next chunk of submissions', () => {
        createSubmissions(12);
        // Chunk 1
        return loadSubmissionList({
          props: { top: (loaded) => (loaded < 8 ? 2 : 3) }
        })
          .beforeEachResponse((component, { url }) => {
            if (url.includes('.svc/Submissions'))
              checkMessage(component, 'Loading the first 2 of 12 Submissions…');
          })
          .afterResponses(component => {
            checkMessage(component, null);
          })
          // Chunk 2
          .request(scroll)
          .beforeEachResponse((component, config) => {
            checkTop(config, 2);
            checkMessage(component, 'Loading 2 more of 10 remaining Submissions…');
          })
          .respondWithData(() => testData.submissionOData(2, 2))
          .afterResponse(component => {
            checkIds(component, 4);
            checkMessage(component, null);
          })
          // Chunk 3
          .request(scroll)
          .beforeEachResponse((component, config) => {
            checkTop(config, 2, 4);
            checkMessage(component, 'Loading 2 more of 8 remaining Submissions…');
          })
          .respondWithData(() => testData.submissionOData(2, 4))
          .afterResponse(component => {
            checkIds(component, 6);
            checkMessage(component, null);
          })
          // Chunk 4 (last small chunk)
          .request(scroll)
          .beforeEachResponse((component, config) => {
            checkTop(config, 2, 6);
            checkMessage(component, 'Loading 2 more of 6 remaining Submissions…');
          })
          .respondWithData(() => testData.submissionOData(2, 6))
          .afterResponse(component => {
            checkIds(component, 8);
            checkMessage(component, null);
          })
          // Chunk 5
          .request(scroll)
          .beforeEachResponse((component, config) => {
            checkTop(config, 3, 8);
            checkMessage(component, 'Loading 3 more of 4 remaining Submissions…');
          })
          .respondWithData(() => testData.submissionOData(3, 8))
          .afterResponse(component => {
            checkIds(component, 11);
            checkMessage(component, null);
          })
          // Chunk 6
          .request(scroll)
          .beforeEachResponse((component, config) => {
            checkTop(config, 3, 11);
            checkMessage(component, 'Loading the last Submission…');
          })
          .respondWithData(() => testData.submissionOData(3, 11))
          .afterResponse(component => {
            checkIds(component, 12);
            checkMessage(component, null);
          });
      });

      it('does nothing upon scroll if keys request results in error', () => {
        createSubmissions(251);
        return load('/projects/1/forms/f/submissions', { root: false }, {
          keys: mockResponse.problem
        })
          .complete()
          .testNoRequest(scroll);
      });

      it('does nothing upon scroll if fields request results in error', () => {
        createSubmissions(251);
        return load('/projects/1/forms/f/submissions', { root: false }, {
          fields: mockResponse.problem
        })
          .complete()
          .testNoRequest(scroll);
      });

      it('does nothing upon scroll if submissions request results in error', () => {
        createSubmissions(251);
        return load('/projects/1/forms/f/submissions', { root: false }, {
          odata: mockResponse.problem
        })
          .complete()
          .testNoRequest(scroll);
      });

      it('does nothing after user scrolls somewhere other than bottom of page', () => {
        createSubmissions(5);
        return loadSubmissionList({
          props: { top: () => 2 }
        })
          .complete()
          .testNoRequest(scroll(false));
      });

      it('clicking refresh button loads first chunk, even after scrolling', () => {
        createSubmissions(5);
        return loadSubmissionList({
          props: { top: () => 2 }
        })
          .complete()
          .request(scroll)
          .respondWithData(() => testData.submissionOData(2, 2))
          .complete()
          .request(component =>
            component.get('#submission-list-refresh-button').trigger('click'))
          .beforeEachResponse((_, config) => {
            checkTop(config, 2, 0);
          })
          .respondWithData(() => testData.submissionOData(2, 0))
          .afterResponse(component => {
            checkIds(component, 2);
          })
          .request(scroll)
          .beforeEachResponse((_, config) => {
            checkTop(config, 2, 2);
          })
          .respondWithData(() => testData.submissionOData(2, 2));
      });

      it('scrolling to the bottom has no effect if awaiting response', () => {
        createSubmissions(5);
        return loadSubmissionList({
          props: { top: () => 2 }
        })
          .complete()
          // Sends a request.
          .request(scroll)
          // This should not send a request. If it does, then the number of
          // requests will exceed the number of responses, and the mockHttp()
          // object will throw an error.
          .beforeAnyResponse(scroll)
          .respondWithData(() => testData.submissionOData(2, 2))
          .complete()
          .request(component =>
            component.get('#submission-list-refresh-button').trigger('click'))
          // Should not send a request.
          .beforeAnyResponse(scroll)
          .respondWithData(() => testData.submissionOData(2, 0));
      });

      it('scrolling has no effect after all submissions have been loaded', () => {
        createSubmissions(2);
        return loadSubmissionList({
          props: { top: () => 2 }
        })
          .complete()
          .testNoRequest(scroll);
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
            return app.get('#submission-list-refresh-button').trigger('click');
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
          key: testData.standardKeys.createPast(1, { managed: true }).last()
        });
        testData.extendedForms.createPast(1, { xmlFormId: 'e', draft: true });
        return load('/projects/1/forms/e/draft/testing', { root: false }, {
          keys: () => [] // if there are 0 submissions, backend returns empty key array
        })
          .complete()
          .request(component =>
            component.get('#submission-list-refresh-button').trigger('click'))
          .beforeAnyResponse(() => {
            testData.extendedSubmissions.createPast(1, { status: 'notDecrypted' });
          })
          .respondWithData(() => testData.submissionOData(1, 0))
          .respondWithData(() => testData.standardKeys.sorted())
          .testRequests([
            null,
            { url: '/v1/projects/1/forms/e/draft/submissions/keys' }
          ]);
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
            component.get('#submission-list-refresh-button').trigger('click'))
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

    describe('count update', () => {
      it.skip('scrolling to the bottom continues to fetch the next chunk', () => {
        createSubmissions(4);
        // 4 submissions exist. About to request $top=2, $skip=0.
        return loadSubmissionList({
          props: { top: () => 2 }
        })
          .beforeEachResponse((component, config) => {
            if (config.url.includes('.svc/Submissions')) {
              checkTop(config, 2, 0);
              checkMessage(component, 'Loading the first 2 of 4 Submissions…');
            }
          })
          .complete()
          // 4 submissions exist, but 4 more are about to be created. About to
          // request $top=2, $skip=2.
          .request(scroll)
          .beforeEachResponse((component, config) => {
            checkTop(config, 2, 2);
            checkMessage(component, 'Loading the last 2 Submissions…');
          })
          .respondWithData(() => {
            testData.extendedSubmissions.createPast(4);
            // This returns 2 of the 4 new submissions.
            return testData.submissionOData(2, 2);
          })
          .afterResponse(component => {
            checkIds(component, 2, 4);
            checkMessage(component, null);
          })
          // 8 submissions exist. About to request $top=2, $skip=4.
          .request(scroll)
          .beforeEachResponse((component, config) => {
            checkTop(config, 2, 4);
            checkMessage(component, 'Loading the last 2 Submissions…');
          })
          // Returns the 2 submissions that are already shown in the table.
          .respondWithData(() => testData.submissionOData(2, 4))
          .afterResponse(component => {
            checkIds(component, 2, 4);
            checkMessage(component, null);
          })
          // 8 submissions exist. About to request $top=2, $skip=6.
          .request(scroll)
          .beforeEachResponse((component, config) => {
            checkTop(config, 2, 6);
            checkMessage(component, 'Loading the last 2 Submissions…');
          })
          // Returns the last 2 submissions.
          .respondWithData(() => testData.submissionOData(2, 6))
          .afterResponse(component => {
            checkIds(component, 4, 4);
            checkMessage(component, null);
          })
          // 8 submissions exist. No request will be sent.
          .testNoRequest(scroll);
      });

      it('does not update requestData.odata.originalCount', () => {
        createSubmissions(251);
        return load('/projects/1/forms/f/submissions', { root: false })
          .afterResponses(component => {
            const { requestData } = component.vm.$container;
            requestData.localResources.odata.originalCount.should.equal(251);
            requestData.form.submissions.should.equal(251);
          })
          .request(scroll)
          .respondWithData(() => {
            testData.extendedSubmissions.createPast(1);
            return testData.submissionOData(2, 250);
          })
          .afterResponse(component => {
            const { requestData } = component.vm.$container;
            requestData.localResources.odata.originalCount.should.equal(251);
            requestData.form.submissions.should.equal(252);
          });
      });
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

    it('specifies $select for the second chunk', () => {
      testData.extendedSubmissions.createPast(2);
      return loadSubmissionList({
        props: { top: () => 1 }
      })
        .complete()
        .request(scroll)
        .beforeEachResponse((_, { url }) => {
          $select(url).should.equal('__id,__system,g/s1,s2,s3,s4,s5,s6,s7,s8,s9,s10');
        })
        .respondWithData(() => testData.submissionOData(1, 1));
    });

    it('specifies $select if the refresh button is clicked', () =>
      loadSubmissionList()
        .complete()
        .request(component =>
          component.get('#submission-list-refresh-button').trigger('click'))
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
          component.get('#submission-list-refresh-button').trigger('click'))
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
          component.get('#submission-list-refresh-button').trigger('click'))
        .beforeAnyResponse(() => {
          testData.extendedSubmissions.createPast(1, { deletedAt: new Date().toISOString() });
        })
        .respondWithData(testData.submissionDeletedOData)
        .afterResponses((component) => {
          component.find('.toggle-deleted-submissions').text().should.equal('2 deleted Submissions');
          component.findAll('.table-freeze-scrolling tbody tr').length.should.be.equal(2);
        });
    });

    it('disables filters and download button', () => {
      testData.extendedSubmissions.createPast(1, { meta: { instanceName: 'live' } });
      testData.extendedSubmissions.createPast(1, { meta: { instanceName: 'deleted 1' }, deletedAt: new Date().toISOString() });
      testData.extendedSubmissions.createPast(1, { meta: { instanceName: 'deleted 2' }, deletedAt: new Date().toISOString() });
      return loadSubmissionList({ props: { deleted: true } })
        .afterResponse(component => {
          component.find('#submission-download-button').attributes('aria-disabled').should.equal('true');
          component.getComponent('#submission-filters').props().disabled.should.be.true;
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
        return load('/projects/1/forms/f/submissions', { root: false })
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
        component.should.alert('success', 'The Submission has been deleted.');
      });

      it('hides the row', async () => {
        const component = await del();
        const row = component.getComponent(SubmissionMetadataRow);
        row.element.dataset.markRowsDeleted.should.equal('true');
      });

      it('updates the submission count', async () => {
        const component = await del();
        const text = component.get('#submission-download-button').text();
        text.should.equal('Download 0 Submissions…');
      });

      it('shows deleted submission button', async () => {
        const component = await del();
        component.get('.toggle-deleted-submissions').should.be.visible();
      });
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
        load('/projects/1/forms/f/submissions', { root: false })
          .complete()
          .request(del(1))
          .respondWithSuccess()
          .afterResponse(component => {
            component.get('#submission-table').should.be.visible();
          })
          .request(del(0))
          .respondWithSuccess()
          .afterResponse(component => {
            component.get('#submission-table').should.be.hidden();
          }));

      it('shows a message', () =>
        load('/projects/1/forms/f/submissions', { root: false })
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
            component.find('.delete-button .spinner').classes().should.not.contain('active');
          }));

      it('shows the correct alert', () =>
        delAndCheck()
          .request(component =>
            component.get('.submission-metadata-row .delete-button').trigger('click'))
          .respondWithSuccess()
          .afterResponse(component => {
            component.should.alert('success', 'The Submission has been deleted.');
          }));

      it('does not hide table after deleting last submission if submissions are concurrently replaced', () =>
        delAndCheck()
          .request(async (component) => {
            await component.get('#submission-list-refresh-button').trigger('click');
            return component.get('.submission-metadata-row .delete-button').trigger('click');
          })
          .respondWithData(() => {
            testData.extendedSubmissions.splice(0);
            testData.extendedSubmissions.createNew();
            testData.extendedSubmissions.createNew();
            return testData.submissionOData();
          })
          .respondWithData(testData.submissionDeletedOData)
          .respondWithSuccess()
          .afterResponses(component => {
            // Even though there were 2 Submissions before, and there are 2
            // Submissions now, and 2 Submissions have been deleted, the table should
            // still be shown.
            component.get('#submission-table').should.be.visible();
            // No row should be hidden.
            component.find('[data-mark-rows-deleted]').exists().should.be.false;
          })
          .request(component =>
            component.get('.submission-metadata-row .delete-button').trigger('click'))
          .respondWithSuccess()
          .afterResponse(component => {
            /* The removedCount should have been reset to 0 when the refreshed
            Submissions were received. (Otherwise, the previous assertion should
            have failed.) However, imagine that after that, the removedCount was
            incorrectly increased to 1 following the success response (if
            requestDelete() in SubmissionList didn't check whether
            odata.value still includes the deleted Submission). In that
            case, this latest deletion would increase the removedCount to 2,
            which would hide the table. Here, we check that that doesn't
            happen. */
            component.get('#submission-table').should.be.visible();
          }));
    });
  });

  describe('restore', () => {
    const loadDeletedSubmissions = () => {
      testData.extendedSubmissions.createPast(1, { instanceId: 'e', deletedAt: new Date().toISOString() });
      return load('/projects/1/forms/f/submissions?deleted=true', { root: false }, {
        deletedSubmissionCount: false,
        odata: testData.submissionDeletedOData
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
        component.should.alert('success', 'The Submission has been undeleted.');
      });

      it('hides the row', async () => {
        const component = await restore();
        const row = component.getComponent(SubmissionMetadataRow);
        row.element.dataset.markRowsDeleted.should.equal('true');
      });

      it('updates the submission count', async () => {
        const component = await restore();
        const text = component.get('.toggle-deleted-submissions').text();
        text.should.equal('0 deleted Submissions');
      });
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
        load('/projects/1/forms/f/submissions?deleted=true', { root: false }, {
          deletedSubmissionCount: false,
          odata: testData.submissionDeletedOData
        })
          .complete()
          .request(restore(1))
          .respondWithSuccess()
          .afterResponse(component => {
            component.get('#submission-table').should.be.visible();
          })
          .request(restore(0))
          .respondWithSuccess()
          .afterResponse(component => {
            component.get('#submission-table').should.be.hidden();
          }));

      it('shows a message', () =>
        load('/projects/1/forms/f/submissions?deleted=true', { root: false }, {
          deletedSubmissionCount: false,
          odata: testData.submissionDeletedOData
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
            component.get('.empty-table-message').text().should.be.equal('There are no deleted Submissions.');
          }));
    });

    it('continues to show modal if checkbox was not checked', () => {
      testData.extendedSubmissions.createPast(2, { deletedAt: new Date().toISOString() });
      return load('/projects/1/forms/f/submissions?deleted=true', { root: false }, {
        deletedSubmissionCount: false,
        odata: testData.submissionDeletedOData
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
          deletedSubmissionCount: false,
          odata: testData.submissionDeletedOData
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
            component.find('.restore-button .spinner').classes().should.not.contain('active');
          }));

      it('shows the correct alert', () =>
        restoreAndCheck()
          .request(component =>
            component.get('.submission-metadata-row .restore-button').trigger('click'))
          .respondWithSuccess()
          .afterResponse(component => {
            component.should.alert('success', 'The Submission has been undeleted.');
          }));

      it('does not hide table after restoreing last submission if submissions are concurrently replaced', () =>
        restoreAndCheck()
          .request(async (component) => {
            await component.get('#submission-list-refresh-button').trigger('click');
            return component.get('.submission-metadata-row .restore-button').trigger('click');
          })
          .respondWithData(() => {
            testData.extendedSubmissions.splice(0);
            testData.extendedSubmissions.createNew({ deletedAt: new Date().toISOString() });
            testData.extendedSubmissions.createNew({ deletedAt: new Date().toISOString() });
            return testData.submissionDeletedOData();
          })
          .respondWithSuccess()
          .afterResponses(component => {
            // Even though there were 2 deleted Submissions before, and there are 2
            // deleted Submissions now, and 2 deleted Submissions have been restored, the table should
            // still be shown.
            component.get('#submission-table').should.be.visible();
            // No row should be hidden.
            component.find('[data-mark-rows-deleted]').exists().should.be.false;
          })
          .request(component =>
            component.get('.submission-metadata-row .restore-button').trigger('click'))
          .respondWithSuccess()
          .afterResponse(component => {
            /* The removedCount should have been reset to 0 when the refreshed
            deleted Submissions were received. (Otherwise, the previous assertion should
            have failed.) However, imagine that after that, the removedCount was
            incorrectly increased to 1 following the success response (if
            requestDelete() in SubmissionList didn't check whether
            odata.value still includes the restored Submission). In that
            case, this latest restore would increase the removedCount to 2,
            which would hide the table. Here, we check that that doesn't
            happen. */
            component.get('#submission-table').should.be.visible();
          }));
    });
  });
});

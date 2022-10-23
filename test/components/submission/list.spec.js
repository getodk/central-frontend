import sinon from 'sinon';

import Spinner from '../../../src/components/spinner.vue';
import SubmissionDataRow from '../../../src/components/submission/data-row.vue';
import SubmissionList from '../../../src/components/submission/list.vue';
import SubmissionMetadataRow from '../../../src/components/submission/metadata-row.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { loadSubmissionList } from '../../util/submission';
import { mockLogin } from '../../util/session';
import { mockResponse } from '../../util/axios';

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

  describe('after login', () => {
    it('shows a message if there are no submissions', () => {
      testData.extendedForms.createPast(1);
      return loadSubmissionList().then(component => {
        component.get('.empty-table-message').should.be.visible();
      });
    });

    describe('after the refresh button is clicked', () => {
      it('completes a background refresh', () => {
        testData.extendedSubmissions.createPast(1);
        const assertRowCount = (count) => (component) => {
          component.findAllComponents(SubmissionMetadataRow).length.should.equal(count);
          component.findAllComponents(SubmissionDataRow).length.should.equal(count);
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
          .afterResponse(assertRowCount(2));
      });

      it('does not show a loading message', () => {
        testData.extendedSubmissions.createPast(1);
        return loadSubmissionList()
          .complete()
          .request(component =>
            component.get('#submission-list-refresh-button').trigger('click'))
          .beforeEachResponse(component => {
            component.get('#submission-list-message').should.be.hidden();
          })
          .respondWithData(testData.submissionOData);
      });
    });

    describe('load by chunk', () => {
      const checkTopSkip = ({ url }, top, skip) => {
        url.should.match(new RegExp(`[?&]%24top=${top}(&|$)`));
        url.should.match(new RegExp(`[?&]%24skip=${skip}(&|$)`));
      };
      const checkIds = (component, count, offset = 0) => {
        const rows = component.findAllComponents(SubmissionDataRow);
        rows.length.should.equal(count);
        const submissions = testData.extendedSubmissions.sorted();
        submissions.length.should.be.aboveOrEqual(count + offset);
        for (let i = 0; i < rows.length; i += 1) {
          const text = rows[i].get('td:last-child').text();
          text.should.equal(submissions[i + offset].instanceId);
        }
      };
      const checkMessage = (component, text) => {
        const message = component.get('#submission-list-message');
        if (text == null) {
          message.should.be.hidden();
        } else {
          message.should.not.be.hidden();
          message.get('#submission-list-message-text').text().should.equal(text);

          const spinner = component.findAllComponents(Spinner).find(wrapper =>
            message.element.contains(wrapper.element));
          spinner.props().state.should.be.true();
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
              checkTopSkip(config, 2, 0);
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
            checkTopSkip(config, 2, 0);
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
            props: { top: (skip) => (skip < 8 ? 2 : 3) }
          })
            .beforeEachResponse((component, { url }) => {
              if (url.includes('.svc/Submissions'))
                checkMessage(component, 'Loading the first 2 of 12 Submissions…');
            })
            .afterResponses(component => {
              checkMessage(component, null);
            })
            // Chunk 2
            .request(component => {
              sinon.replace(component.vm, 'scrolledToBottom', () => true);
              document.dispatchEvent(new Event('scroll'));
            })
            .beforeEachResponse((component, config) => {
              checkTopSkip(config, 2, 2);
              checkMessage(component, 'Loading 2 more of 10 remaining Submissions…');
            })
            .respondWithData(() => testData.submissionOData(2, 2))
            .afterResponse(component => {
              checkIds(component, 4);
              checkMessage(component, null);
            })
            // Chunk 3
            .request(() => {
              document.dispatchEvent(new Event('scroll'));
            })
            .beforeEachResponse((component, config) => {
              checkTopSkip(config, 2, 4);
              checkMessage(component, 'Loading 2 more of 8 remaining Submissions…');
            })
            .respondWithData(() => testData.submissionOData(2, 4))
            .afterResponse(component => {
              checkIds(component, 6);
              checkMessage(component, null);
            })
            // Chunk 4 (last small chunk)
            .request(() => {
              document.dispatchEvent(new Event('scroll'));
            })
            .beforeEachResponse((component, config) => {
              checkTopSkip(config, 2, 6);
              checkMessage(component, 'Loading 2 more of 6 remaining Submissions…');
            })
            .respondWithData(() => testData.submissionOData(2, 6))
            .afterResponse(component => {
              checkIds(component, 8);
              checkMessage(component, null);
            })
            // Chunk 5
            .request(() => {
              document.dispatchEvent(new Event('scroll'));
            })
            .beforeEachResponse((component, config) => {
              checkTopSkip(config, 3, 8);
              checkMessage(component, 'Loading 3 more of 4 remaining Submissions…');
            })
            .respondWithData(() => testData.submissionOData(3, 8))
            .afterResponse(component => {
              checkIds(component, 11);
              checkMessage(component, null);
            })
            // Chunk 6
            .request(() => {
              document.dispatchEvent(new Event('scroll'));
            })
            .beforeEachResponse((component, config) => {
              checkTopSkip(config, 3, 11);
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
            .testNoRequest(component => {
              sinon.replace(
                component.getComponent(SubmissionList).vm,
                'scrolledToBottom',
                () => true
              );
              document.dispatchEvent(new Event('scroll'));
            });
        });

        it('does nothing upon scroll if fields request results in error', () => {
          createSubmissions(251);
          return load('/projects/1/forms/f/submissions', { root: false }, {
            fields: mockResponse.problem
          })
            .complete()
            .testNoRequest(component => {
              sinon.replace(
                component.getComponent(SubmissionList).vm,
                'scrolledToBottom',
                () => true
              );
              document.dispatchEvent(new Event('scroll'));
            });
        });

        it('does nothing upon scroll if submissions request results in error', () => {
          createSubmissions(251);
          return load('/projects/1/forms/f/submissions', { root: false }, {
            odata: mockResponse.problem
          })
            .complete()
            .testNoRequest(component => {
              sinon.replace(
                component.getComponent(SubmissionList).vm,
                'scrolledToBottom',
                () => true
              );
              document.dispatchEvent(new Event('scroll'));
            });
        });

        it('does nothing after user scrolls somewhere other than bottom of page', () => {
          createSubmissions(5);
          return loadSubmissionList({
            props: { top: () => 2 }
          })
            .complete()
            .testNoRequest(component => {
              sinon.replace(
                component.getComponent(SubmissionList).vm,
                'scrolledToBottom',
                () => false
              );
              document.dispatchEvent(new Event('scroll'));
            });
        });

        it('clicking refresh button loads first chunk, even after scrolling', () => {
          createSubmissions(5);
          return loadSubmissionList({
            props: { top: () => 2 }
          })
            .complete()
            .request(component => {
              sinon.replace(component.vm, 'scrolledToBottom', () => true);
              document.dispatchEvent(new Event('scroll'));
            })
            .respondWithData(() => testData.submissionOData(2, 2))
            .complete()
            .request(component =>
              component.get('#submission-list-refresh-button').trigger('click'))
            .beforeEachResponse((_, config) => {
              checkTopSkip(config, 2, 0);
            })
            .respondWithData(() => testData.submissionOData(2, 0))
            .afterResponse(component => {
              checkIds(component, 2);
            })
            .request(() => {
              document.dispatchEvent(new Event('scroll'));
            })
            .beforeEachResponse((_, config) => {
              checkTopSkip(config, 2, 2);
            })
            .respondWithData(() => testData.submissionOData(2, 2));
        });

        it('scrolling to the bottom has no effect if awaiting response', () => {
          createSubmissions(5);
          return loadSubmissionList({
            props: { top: () => 2 }
          })
            .complete()
            .request(component => {
              sinon.replace(component.vm, 'scrolledToBottom', () => true);
              // Sends a request.
              document.dispatchEvent(new Event('scroll'));
            })
            .beforeAnyResponse(() => {
              // This should not send a request. If it does, then the number of
              // requests will exceed the number of responses, and the
              // mockHttp() object will throw an error.
              document.dispatchEvent(new Event('scroll'));
            })
            .respondWithData(() => testData.submissionOData(2, 2))
            .complete()
            .request(component =>
              component.get('#submission-list-refresh-button').trigger('click'))
            .beforeAnyResponse(() => {
              // Should not send a request.
              document.dispatchEvent(new Event('scroll'));
            })
            .respondWithData(() => testData.submissionOData(2, 0));
        });

        it('scrolling has no effect after all submissions have been loaded', () => {
          createSubmissions(2);
          return loadSubmissionList({
            props: { top: () => 2 }
          })
            .complete()
            .request(component => {
              sinon.replace(component.vm, 'scrolledToBottom', () => true);
              document.dispatchEvent(new Event('scroll'));
            });
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
                checkTopSkip(config, 2, 0);
                checkMessage(component, 'Loading the first 2 of 4 Submissions…');
              }
            })
            .complete()
            // 4 submissions exist, but 4 more are about to be created. About to
            // request $top=2, $skip=2.
            .request(component => {
              sinon.replace(component.vm, 'scrolledToBottom', () => true);
              document.dispatchEvent(new Event('scroll'));
            })
            .beforeEachResponse((component, config) => {
              checkTopSkip(config, 2, 2);
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
            .request(() => {
              document.dispatchEvent(new Event('scroll'));
            })
            .beforeEachResponse((component, config) => {
              checkTopSkip(config, 2, 4);
              checkMessage(component, 'Loading the last 2 Submissions…');
            })
            // Returns the 2 submissions that are already shown in the table.
            .respondWithData(() => testData.submissionOData(2, 4))
            .afterResponse(component => {
              checkIds(component, 2, 4);
              checkMessage(component, null);
            })
            // 8 submissions exist. About to request $top=2, $skip=6.
            .request(() => {
              document.dispatchEvent(new Event('scroll'));
            })
            .beforeEachResponse((component, config) => {
              checkTopSkip(config, 2, 6);
              checkMessage(component, 'Loading the last 2 Submissions…');
            })
            // Returns the last 2 submissions.
            .respondWithData(() => testData.submissionOData(2, 6))
            .afterResponse(component => {
              checkIds(component, 4, 4);
              checkMessage(component, null);
            })
            // 8 submissions exist. No request will be sent.
            .testNoRequest(() => {
              document.dispatchEvent(new Event('scroll'));
            });
        });

        it('does not update requestData.odata.originalCount', () => {
          createSubmissions(251);
          return load('/projects/1/forms/f/submissions', { root: false })
            .afterResponses(component => {
              const { requestData } = component.vm.$container;
              requestData.localResources.odata.originalCount.should.equal(251);
              requestData.form.submissions.should.equal(251);
            })
            .request(component => {
              sinon.replace(
                component.getComponent(SubmissionList).vm,
                'scrolledToBottom',
                () => true
              );
              document.dispatchEvent(new Event('scroll'));
            })
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
  });
});

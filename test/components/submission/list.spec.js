import SubmissionList from '../../../src/components/submission/list.vue';
import Spinner from '../../../src/components/spinner.vue';

import Form from '../../../src/presenters/form';

import testData from '../../data';
import { load, mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';
import { trigger } from '../../util/event';

// Create submissions along with the associated project and form.
const createSubmissions = (count, factoryOptions = {}) => {
  testData.extendedProjects.size.should.equal(0);
  testData.extendedForms.size.should.equal(0);
  testData.extendedSubmissions.size.should.equal(0);

  testData.extendedForms.createPast(1, { submissions: count });
  testData.extendedSubmissions.createPast(count, factoryOptions);
};
const loadSubmissionList = (
  top = SubmissionList.props.top.default,
  scrolledToBottom = true
) => {
  // Check test data.
  testData.extendedProjects.size.should.equal(1);
  testData.extendedForms.size.should.equal(1);
  const form = testData.extendedForms.last();
  form.xmlFormId.should.equal('f');
  form.submissions.should.equal(testData.extendedSubmissions.size);

  return mockHttp()
    .mount(SubmissionList, {
      propsData: {
        baseUrl: '/v1/projects/1/forms/f',
        formVersion: new Form(form),
        showsSubmitter: true,
        top,
        scrolledToBottom: () => scrolledToBottom
      },
      requestData: { keys: testData.standardKeys.sorted() }
    })
    .respondWithData(() => testData.extendedForms.last()._fields)
    .respondWithData(() => testData.submissionOData(top(0), 0));
};

describe('SubmissionList', () => {
  beforeEach(mockLogin);

  describe('after login', () => {
    describe('encrypted submissions', () => {
      it('indicates whether a submission is encrypted', () => {
        const key = testData.standardKeys.createPast(1).last();
        testData.extendedProjects.createPast(1, { key });
        testData.extendedForms.createPast(1, {
          fields: [
            testData.fields.string('/s1'),
            testData.fields.string('/s2')
          ],
          submissions: 2
        });
        testData.extendedSubmissions
          .createPast(1, { status: null })
          .createPast(1, { status: 'NotDecrypted' });
        return loadSubmissionList().afterResponses(component => {
          const tr = component.find('#submission-table2 tbody tr');
          tr.length.should.equal(2);

          tr[1].hasClass('encrypted-submission').should.be.false();
          tr[1].find('td').length.should.equal(3);

          tr[0].hasClass('encrypted-submission').should.be.true();
          tr[0].find('td').length.should.equal(2);
          tr[0].first('td').getAttribute('colspan').should.equal('2');
        });
      });

      it('does not show encryption message if form only has instanceID field', () => {
        const key = testData.standardKeys.createPast(1).last();
        testData.extendedProjects.createPast(1, { key });
        const fields = [
          { path: '/meta', type: 'structure' },
          { path: '/meta/instanceID', type: 'string' }
        ];
        testData.extendedForms.createPast(1, { fields, submissions: 1 });
        testData.extendedSubmissions.createPast(1, { status: 'NotDecrypted' });
        return loadSubmissionList().afterResponses(component => {
          const td = component.find('#submission-table2 tbody td');
          td.length.should.equal(1);
          should.not.exist(td[0].element.getAttribute('colspan'));
        });
      });
    });

    it('shows a message if there are no submissions', () => {
      testData.extendedForms.createPast(1);
      return loadSubmissionList().then(component => {
        component.first('.empty-table-message').should.be.visible();
      });
    });

    describe('after the refresh button is clicked', () => {
      it('completes a background refresh', () => {
        testData.extendedForms.createPast(1, { submissions: 1 });
        testData.extendedSubmissions.createPast(1);
        const assertRowCount = (count) => (component) => {
          component.find('#submission-table1 tbody tr').length.should.equal(count);
          component.find('#submission-table2 tbody tr').length.should.equal(count);
        };
        return load('/projects/1/forms/f/submissions', { component: true }, {})
          .afterResponses(assertRowCount(1))
          .request(trigger.click('#submission-list-refresh-button'))
          .beforeEachResponse(assertRowCount(1))
          .respondWithData(() => {
            testData.extendedSubmissions.createNew();
            return testData.submissionOData();
          })
          .afterResponse(assertRowCount(2));
      });

      it('does not show a loading message', () => {
        testData.extendedForms.createPast(1, { submissions: 1 });
        testData.extendedSubmissions.createPast(1);
        return loadSubmissionList()
          .complete()
          .request(trigger.click('#submission-list-refresh-button'))
          .beforeEachResponse(component => {
            component.first('#submission-list-message').should.be.hidden();
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
        const rows = component.find('#submission-table2 tbody tr');
        rows.length.should.equal(count);
        const submissions = testData.extendedSubmissions.sorted();
        submissions.length.should.be.aboveOrEqual(count + offset);
        for (let i = 0; i < rows.length; i += 1) {
          const cells = rows[i].find('td');
          const lastCell = cells[cells.length - 1];
          const text = lastCell.text().trim();
          text.should.equal(submissions[i + offset].instanceId);
        }
      };
      const checkMessage = (component, text) => {
        const message = component.first('#submission-list-message');
        if (text == null) {
          message.should.be.hidden();
        } else {
          message.should.not.be.hidden();

          const spinners = component.find(Spinner).filter(spinner =>
            message.element.contains(spinner.vm.$el));
          spinners.length.should.equal(1);
          spinners[0].getProp('state').should.equal(true);

          message.first('#submission-list-message-text').text().trim().should.equal(text);
        }
      };

      it('loads a single submission', () => {
        createSubmissions(1);
        return loadSubmissionList()
          .beforeEachResponse((component) => {
            checkMessage(component, 'Loading 1 Submission…');
          });
      });

      it('loads all submissions if there are few of them', () => {
        createSubmissions(2);
        return loadSubmissionList()
          .beforeEachResponse((component) => {
            checkMessage(component, 'Loading 2 Submissions…');
          });
      });

      it('initially loads only the first chunk if there are many submissions', () => {
        let tested = false;
        createSubmissions(3);
        return loadSubmissionList(() => 2)
          .beforeEachResponse((component, request) => {
            if (!request.url.includes('.svc/Submissions')) return;
            checkMessage(component, 'Loading the first 2 of 3 Submissions…');
            checkTopSkip(request, 2, 0);
            tested = true;
          })
          .afterResponses(component => {
            tested.should.be.true();
            checkIds(component, 2);
          });
      });

      it('clicking refresh button loads only first chunk of submissions', () => {
        createSubmissions(3);
        return loadSubmissionList(() => 2)
          .complete()
          .request(trigger.click('#submission-list-refresh-button'))
          .beforeEachResponse((component, request) => {
            checkTopSkip(request, 2, 0);
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
          return loadSubmissionList((skip) => (skip < 8 ? 2 : 3))
            .beforeEachResponse(component => {
              checkMessage(component, 'Loading the first 2 of 12 Submissions…');
            })
            .afterResponses(component => {
              checkMessage(component, null);
            })
            // Chunk 2
            .request(component => {
              component.vm.onScroll();
            })
            .beforeEachResponse((component, request) => {
              checkTopSkip(request, 2, 2);
              checkMessage(component, 'Loading 2 more of 10 remaining Submissions…');
            })
            .respondWithData(() => testData.submissionOData(2, 2))
            .afterResponse(component => {
              checkIds(component, 4);
              checkMessage(component, null);
            })
            // Chunk 3
            .request(component => {
              component.vm.onScroll();
            })
            .beforeEachResponse((component, request) => {
              checkTopSkip(request, 2, 4);
              checkMessage(component, 'Loading 2 more of 8 remaining Submissions…');
            })
            .respondWithData(() => testData.submissionOData(2, 4))
            .afterResponse(component => {
              checkIds(component, 6);
              checkMessage(component, null);
            })
            // Chunk 4 (last small chunk)
            .request(component => {
              component.vm.onScroll();
            })
            .beforeEachResponse((component, request) => {
              checkTopSkip(request, 2, 6);
              checkMessage(component, 'Loading 2 more of 6 remaining Submissions…');
            })
            .respondWithData(() => testData.submissionOData(2, 6))
            .afterResponse(component => {
              checkIds(component, 8);
              checkMessage(component, null);
            })
            // Chunk 5
            .request(component => {
              component.vm.onScroll();
            })
            .beforeEachResponse((component, request) => {
              checkTopSkip(request, 3, 8);
              checkMessage(component, 'Loading 3 more of 4 remaining Submissions…');
            })
            .respondWithData(() => testData.submissionOData(3, 8))
            .afterResponse(component => {
              checkIds(component, 11);
              checkMessage(component, null);
            })
            // Chunk 6
            .request(component => {
              component.vm.onScroll();
            })
            .beforeEachResponse((component, request) => {
              checkTopSkip(request, 3, 11);
              checkMessage(component, 'Loading the last Submission…');
            })
            .respondWithData(() => testData.submissionOData(3, 11))
            .afterResponse(component => {
              checkIds(component, 12);
              checkMessage(component, null);
            });
        });

        it('does nothing upon scroll if form version does not exist', () => {
          testData.extendedForms.createPast(1, { submissions: 2 });
          testData.extendedSubmissions.createPast(2);
          return mockHttp()
            .mount(SubmissionList, {
              propsData: {
                baseUrl: '/base',
                formVersion: null,
                top: () => 1,
                scrolledToBottom: () => true
              },
              requestData: { keys: [] }
            })
            .respondWithData(() => testData.extendedForms.last()._fields)
            .respondWithData(() => testData.submissionOData(1, 0))
            .complete()
            .testNoRequest(component => {
              component.vm.onScroll();
            });
        });

        it('does nothing upon scroll if keys request results in error', () =>
          mockHttp()
            .mount(SubmissionList, {
              propsData: {
                baseUrl: '/v1/projects/1/forms/f',
                formVersion: new Form(testData.extendedForms
                  .createPast(1, { submissions: 2 })
                  .last()),
                top: () => 1,
                scrolledToBottom: () => true
              }
            })
            .respondWithData(() => testData.extendedForms.last()._fields)
            .respondWithData(() => {
              testData.extendedSubmissions.createPast(2);
              return testData.submissionOData(1, 0);
            })
            .complete()
            .testNoRequest(component => {
              component.vm.onScroll();
            }));

        it('does nothing upon scroll if fields request results in error', () =>
          mockHttp()
            .mount(SubmissionList, {
              propsData: {
                baseUrl: '/v1/projects/1/forms/f',
                formVersion: new Form(testData.extendedForms
                  .createPast(1, { submissions: 2 })
                  .last()),
                top: () => 1,
                scrolledToBottom: () => true
              },
              requestData: { keys: [] }
            })
            .respondWithProblem()
            .respondWithData(() => {
              testData.extendedSubmissions.createPast(2);
              return testData.submissionOData(1, 0);
            })
            .complete()
            .testNoRequest(component => {
              component.vm.onScroll();
            }));

        it('does nothing upon scroll if submissions request results in error', () =>
          mockHttp()
            .mount(SubmissionList, {
              propsData: {
                baseUrl: '/v1/projects/1/forms/f',
                formVersion: new Form(testData.extendedForms
                  .createPast(1, { submissions: 2 })
                  .last()),
                top: () => 1,
                scrolledToBottom: () => true
              },
              requestData: { keys: [] }
            })
            .respondWithData(() => testData.extendedForms.last()._fields)
            .respondWithProblem()
            .complete()
            .testNoRequest(component => {
              component.vm.onScroll();
            }));

        it('does nothing after user scrolls somewhere other than bottom of page', () => {
          createSubmissions(5);
          return loadSubmissionList(() => 2, false)
            .complete()
            .testNoRequest(component => {
              component.vm.onScroll();
            });
        });

        it('clicking refresh button loads first chunk, even after scrolling', () => {
          createSubmissions(5);
          return loadSubmissionList(() => 2)
            .complete()
            .request(component => {
              component.vm.onScroll();
            })
            .respondWithData(() => testData.submissionOData(2, 2))
            .complete()
            .request(trigger.click('#submission-list-refresh-button'))
            .beforeEachResponse((component, request) => {
              checkTopSkip(request, 2, 0);
            })
            .respondWithData(() => testData.submissionOData(2, 0))
            .afterResponse(component => {
              checkIds(component, 2);
            })
            .request(component => {
              component.vm.onScroll();
            })
            .beforeEachResponse((component, request) => {
              checkTopSkip(request, 2, 2);
            })
            .respondWithData(() => testData.submissionOData(2, 2));
        });

        it('scrolling to the bottom has no effect if awaiting response', () => {
          createSubmissions(5);
          return loadSubmissionList(() => 2)
            .complete()
            .request(component => {
              // Sends a request.
              component.vm.onScroll();
            })
            .beforeAnyResponse(component => {
              // This should not send a request. If it does, then the number of
              // requests will exceed the number of responses, and the
              // mockHttp() object will throw an error.
              component.vm.onScroll();
            })
            .respondWithData(() => testData.submissionOData(2, 2))
            .complete()
            .request(trigger.click('#submission-list-refresh-button'))
            .beforeAnyResponse(component => {
              // Should not send a request.
              component.vm.onScroll();
            })
            .respondWithData(() => testData.submissionOData(2, 0));
        });

        it('scrolling has no effect after all submissions have been loaded', () => {
          createSubmissions(2);
          return loadSubmissionList(() => 2)
            .complete()
            .request(component => {
              component.vm.onScroll();
            });
        });
      });

      describe('count update', () => {
        it('updates the count in the download button', () => {
          createSubmissions(10);
          return load('/projects/1/forms/f')
            .complete()
            .load('/projects/1/forms/f/submissions', {
              project: false,
              form: false,
              formDraft: false,
              attachments: false
            })
            .afterResponses(app => {
              const button = app.first('#submission-download-dropdown-toggle');
              button.text().trim().should.equal('Download 10 records');
            })
            .request(trigger.click('#submission-list-refresh-button'))
            .respondWithData(() => {
              testData.extendedSubmissions.createPast(1);
              return testData.submissionOData();
            })
            .afterResponses(app => {
              const button = app.first('#submission-download-dropdown-toggle');
              button.text().trim().should.equal('Download 11 records');
            });
        });

        it.skip('scrolling to the bottom continues to fetch the next chunk', () => {
          createSubmissions(4);
          // 4 submissions exist. About to request $top=2, $skip=0.
          return loadSubmissionList(() => 2)
            .beforeEachResponse((component, config, index) => {
              if (index === 2) {
                checkTopSkip(config, 2, 0);
                checkMessage(component, 'Loading the first 2 of 4 Submissions…');
              }
            })
            .complete()
            // 4 submissions exist, but 4 more are about to be created. About to
            // request $top=2, $skip=2.
            .request(component => {
              component.vm.onScroll();
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
            .request(component => {
              component.vm.onScroll();
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
            .request(component => {
              component.vm.onScroll();
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
            .testNoRequest(component => {
              component.vm.onScroll();
            });
        });

        it.skip('does not update originalCount', () => {
          testData.extendedForms.createPast(1, { submissions: 2 });
          testData.extendedSubmissions.createPast(2);
          return loadSubmissionList(() => 1)
            .afterResponses(component => {
              component.data().originalCount.should.equal(2);
              component.getProp('formVersion').submissions.should.equal(2);
            })
            .request(component => {
              component.vm.onScroll();
            })
            .respondWithData(() => {
              testData.extendedSubmissions.createPast(1);
              return testData.submissionOData(1, 1);
            })
            .afterResponse(component => {
              component.data().originalCount.should.equal(2);
              component.getProp('formVersion').submissions.should.equal(3);
            });
        });
      });
    });
  });
});

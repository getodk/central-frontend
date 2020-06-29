import Form from '../../../src/presenters/form';
import SubmissionList from '../../../src/components/submission/list.vue';
import Spinner from '../../../src/components/spinner.vue';
import testData from '../../data';
import { load, mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';
import { setLuxon } from '../../util/date-time';
import { trigger } from '../../util/event';

// Create submissions along with the associated project and form.
const createSubmissions = (count, factoryOptions = {}) => {
  testData.extendedProjects.size.should.equal(0);
  testData.extendedForms.size.should.equal(0);
  testData.extendedSubmissions.size.should.equal(0);

  testData.extendedForms.createPast(1, { submissions: count });
  testData.extendedSubmissions.createPast(count, factoryOptions);
};
const loadSubmissionList = (chunkSizes = [], scrolledToBottom = true) => {
  // Check test data.
  testData.extendedProjects.size.should.equal(1);
  testData.extendedForms.size.should.equal(1);
  const form = testData.extendedForms.last();
  form.xmlFormId.should.equal('f');
  form.submissions.should.equal(testData.extendedSubmissions.size);

  const [small = 250, large = 1000] = chunkSizes;
  return mockHttp()
    .mount(SubmissionList, {
      propsData: {
        baseUrl: '/v1/projects/1/forms/f',
        formVersion: new Form(form),
        showsSubmitter: true,
        chunkSizes: { small, large },
        scrolledToBottom: () => scrolledToBottom
      }
    })
    .respondWithData(() => testData.standardKeys.sorted())
    .respondWithData(() => testData.extendedForms.last()._fields)
    .respondWithData(() => testData.submissionOData(small, 0));
};

describe('SubmissionList', () => {
  beforeEach(mockLogin);

  describe('after login', () => {
    describe('table data', () => {
      describe('right half of the table', () => {
        const headers = [
          'testInt',
          'testDecimal',
          'testDate',
          'testTime',
          'testDateTime',
          'testGeopoint',
          'testGroup-testBinary',
          'testGroup-testBinary',
          'testBranch',
          'testString1',
          'Instance ID'
        ];
        const tdByRowAndColumn = (tr, header) => {
          const index = headers.indexOf(header);
          if (index === -1) throw new Error('header not found');
          return tr.find('td')[index];
        };

        it('contains the correct column headers', () => {
          testData.extendedProjects.createPast(1);
          testData.extendedForms
            .createPast(1, { hasInstanceId: true, submissions: 1 });
          testData.extendedSubmissions.createPast(1);
          return loadSubmissionList().afterResponses(component => {
            const th = component.find('#submission-table2 th');
            th.map(wrapper => wrapper.text().trim()).should.eql(headers);
          });
        });

        it('contains the correct instance IDs', () => {
          createSubmissions(2);
          return loadSubmissionList().afterResponses(component => {
            const tr = component.find('#submission-table2 tbody tr');
            const submissions = testData.extendedSubmissions.sorted();
            tr.length.should.equal(submissions.length);
            for (let i = 0; i < tr.length; i += 1) {
              const td = tdByRowAndColumn(tr[i], 'Instance ID');
              td.text().trim().should.equal(submissions[i].instanceId);
            }
          });
        });

        it('correctly formats int values', () => {
          createSubmissions(1, { hasInt: true });
          return loadSubmissionList().afterResponses(component => {
            const td = tdByRowAndColumn(
              component.first('#submission-table2 tbody tr'),
              'testInt'
            );
            const submission = testData.extendedSubmissions.last();
            const localeString = submission._oData.testInt.toLocaleString();
            td.text().trim().should.equal(localeString);
            td.hasClass('submission-cell-int').should.be.true();
          });
        });

        describe('decimal values', () => {
          it('adds the correct class', () => {
            createSubmissions(1, { hasDecimal: true });
            return loadSubmissionList()
              .afterResponses(component => {
                const td = tdByRowAndColumn(
                  component.first('#submission-table2 tbody tr'),
                  'testDecimal'
                );
                td.hasClass('submission-cell-decimal').should.be.true();
              });
          });

          // Array of test cases, where each case is an array with the following
          // structure:
          // [raw value, expected formatted value]
          const cases = [
            [1, '1'],
            [1234, '1,234'],
            [1.2, '1.2'],
            [-1.2, '-1.2'],
            [1234.5678901234, '1,234.5678901234'],
            [-1234.567890123, '-1,234.567890123'],
            [0.0000000000001, '0.0000000000001'],
            [-0.000000000001, '-0.000000000001'],
            // More than 15 characters
            [1000000000000000, '1,000,000,000,000,000'],
            [-100000000000000, '-100,000,000,000,000'],
            [10000000000000.1, '10,000,000,000,000.1'],
            [-1000000000000.1, '-1,000,000,000,000.1'],
            [1234.56789012345, '1,234.5678901235'],
            [-1234.5678901234, '-1,234.567890123'],
            [0.00000000000001, '0'],
            [-0.0000000000001, '-0']
          ];
          for (const [testDecimal, localeString] of cases) {
            it(`correctly formats ${testDecimal}`, () => {
              createSubmissions(1, { testDecimal });
              return loadSubmissionList().afterResponses(component => {
                const td = tdByRowAndColumn(
                  component.first('#submission-table2 tbody tr'),
                  'testDecimal'
                );
                td.text().trim().should.equal(localeString);
              });
            });
          }
        });

        it('correctly formats string values', () => {
          createSubmissions(1, { hasStrings: true });
          return loadSubmissionList().afterResponses(component => {
            const td = tdByRowAndColumn(
              component.first('#submission-table2 tbody tr'),
              'testString1'
            );
            const { testString1 } = testData.extendedSubmissions.last()._oData;
            td.text().trim().should.equal(testString1.trim());
            td.getAttribute('title').should.equal(testString1);
          });
        });

        describe('date values', () => {
          // Each test case is an array with the following structure:
          // [raw value, expected formatted value]
          const cases = [
            ['2018-01-01', '2018/01/01'],
            // If we end up needing to support time zones, we should check that
            // the existing code accounts for DST.
            ['2018-01-01Z', 'Invalid DateTime'],
            ['2018-01-01+01:00', 'Invalid DateTime'],
            // A date value that is not ISO 8601
            ['2018/01/01', 'Invalid DateTime']
          ];
          for (const [testDate, formatted] of cases) {
            it(`correctly formats ${testDate}`, () => {
              createSubmissions(1, { testDate });
              return loadSubmissionList().afterResponses(component => {
                const td = tdByRowAndColumn(
                  component.first('#submission-table2 tbody tr'),
                  'testDate'
                );
                td.text().trim().should.equal(formatted);
              });
            });
          }
        });

        describe('time values', () => {
          /*
          Each test case is an array with the following structure:

          [
            default time zone (mocking the system time zone),
            ISO 8601 string to use as the current timestamp (mocking the system time),
            raw value,
            expected formatted value
          ]
          */
          const cases = [
            ['UTC+1', null, '01:02:03.567', '01:02:03'],
            ['UTC+1', null, '00:00:00Z', '00:00:00'],
            ['UTC+1', null, '02:00:00+02:00', '02:00:00'],
            ['UTC+1', null, '12 a.m.', 'Invalid DateTime'],
            // DST invalid time
            ['America/New_York', '2017-03-12', '02:30:00', '02:30:00'],
            ['America/New_York', '2017-03-12', '02:30:00Z', '02:30:00'],
            // DST ambiguous time
            ['America/New_York', '2017-11-05', '01:30:00', '01:30:00'],
            ['America/New_York', '2017-11-05', '01:30:00Z', '01:30:00']
          ];
          for (const [defaultZoneName, now, testTime, formatted] of cases) {
            it(`correctly formats ${testTime}`, () => {
              createSubmissions(1, { testTime });

              const settings = { defaultZoneName };
              if (now != null) settings.now = now;
              const restoreLuxon = setLuxon(settings);

              return loadSubmissionList()
                .afterResponses(component => {
                  const td = tdByRowAndColumn(
                    component.first('#submission-table2 tbody tr'),
                    'testTime'
                  );
                  td.text().trim().should.equal(formatted);
                })
                .finally(restoreLuxon);
            });
          }
        });

        describe('dateTime values', () => {
          /*
          Each test case is an array with the following structure:

          [
            default time zone (mocking the system time zone),
            ISO 8601 string to use as the current timestamp (mocking the system time),
            raw value,
            expected formatted value
          ]
          */
          const cases = [
            ['UTC+1', null, '2018-01-01T01:02:03.567', '2018/01/01 01:02:03'],
            ['UTC+1', null, '2018-01-01T00:00:00Z', '2018/01/01 01:00:00'],
            ['UTC+1', null, '2018-01-01T02:00:00+02:00', '2018/01/01 01:00:00'],
            ['UTC+1', null, '2018/01/01T00:00:00', 'Invalid DateTime'],
            // DST invalid time
            ['America/New_York', '2017-03-12', '2017-03-12T02:30:00', '2017/03/12 03:30:00'],
            ['America/New_York', '2017-03-12', '2017-03-12T02:30:00Z', '2017/03/11 21:30:00'],
            // DST ambiguous time
            ['America/New_York', '2017-11-05', '2017-11-05T01:30:00', '2017/11/05 01:30:00'],
            ['America/New_York', '2017-11-05', '2017-11-05T01:30:00Z', '2017/11/04 21:30:00']
          ];
          for (const [defaultZoneName, now, testDateTime, formatted] of cases) {
            it(`correctly formats ${testDateTime}`, () => {
              createSubmissions(1, { testDateTime });

              const settings = { defaultZoneName };
              if (now != null) settings.now = now;
              const restoreLuxon = setLuxon(settings);

              return loadSubmissionList()
                .afterResponses(component => {
                  const td = tdByRowAndColumn(
                    component.first('#submission-table2 tbody tr'),
                    'testDateTime'
                  );
                  td.text().trim().should.equal(formatted);
                })
                .finally(restoreLuxon);
            });
          }
        });

        describe('geopoint values', () => {
          const geopoint = (...coordinates) => ({ type: 'Point', coordinates });
          // Each test case is an array with the following structure:
          // [raw value, expected formatted value]
          const cases = [
            [geopoint(0.1234567, 0.1234567), '0.1234567 0.1234567'],
            [geopoint(0.123456, 0.123456), '0.1234560 0.1234560'],
            [geopoint(0.12345678, 0.12345678), '0.1234568 0.1234568'],
            [geopoint(0.1234567, 0.1234567, 0.1), '0.1234567 0.1234567 0.1'],
            [geopoint(0.1234567, 0.1234567, 0), '0.1234567 0.1234567 0.0'],
            [geopoint(0.1234567, 0.1234567, 0.15), '0.1234567 0.1234567 0.2']
          ];
          for (const [testGeopoint, formatted] of cases) {
            it(`correctly formats ${testGeopoint.coordinates.join(' ')}`, () => {
              createSubmissions(1, { testGeopoint });
              return loadSubmissionList().afterResponses(component => {
                const td = tdByRowAndColumn(
                  component.first('#submission-table2 tbody tr'),
                  'testGeopoint'
                );
                td.text().trim().should.equal(formatted);
              });
            });
          }
        });
      });
    });

    describe('encrypted submissions', () => {
      it('indicates whether a submission is encrypted', () => {
        const key = testData.standardKeys.createPast(1).last();
        testData.extendedProjects.createPast(1, { key });
        testData.extendedForms.createPast(1, { submissions: 2 });
        testData.extendedSubmissions
          .createPast(1, { status: null })
          .createPast(1, { status: 'NotDecrypted' });
        return loadSubmissionList().afterResponses(component => {
          const tr = component.find('#submission-table2 tbody tr');
          tr.length.should.equal(2);

          tr[1].hasClass('encrypted-submission').should.be.false();
          tr[1].find('td').length.should.equal(11);

          tr[0].hasClass('encrypted-submission').should.be.true();
          tr[0].find('td').length.should.equal(2);
          tr[0].first('td').getAttribute('colspan').should.equal('10');
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

    describe('refresh button', () => {
      for (let i = 1; i <= 2; i += 1) {
        it(`refreshes part ${i} of table after refresh button is clicked`, () => {
          testData.extendedForms.createPast(1).last();
          return load('/projects/1/forms/f/submissions', {}, {
            submissionsChunk: false
          })
            .testRefreshButton({
              collection: testData.extendedSubmissions,
              respondWithData: testData.submissionOData,
              tableSelector: `#submission-table${i}`
            });
        });
      }
    });

    describe('download button', () => {
      it('shows the number of submissions', () => {
        createSubmissions(2);
        return loadSubmissionList()
          .afterResponses(page => {
            const button = page.first('#submission-list-download-button');
            const text = button.text().trim().replace(/\s+/g, ' ');
            const count = testData.extendedSubmissions.size;
            text.should.equal(`Download all ${count} records`);
          });
      });

      it('has the correct href', () => {
        createSubmissions(1);
        return loadSubmissionList()
          .afterResponses(page => {
            const button = page.first('#submission-list-download-button');
            const $button = $(button.element);
            $button.prop('tagName').should.equal('A');
            $button.attr('href').should.equal('/v1/projects/1/forms/f/submissions.csv.zip');
          });
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
      const checkMessage = (component, spinnerShown, text) => {
        const message = component.first('#submission-list-message');
        const spinners = component.find(Spinner)
          .filter(wrapper => $.contains(message.element, wrapper.vm.$el));
        spinners.length.should.equal(1);
        spinners[0].getProp('state').should.equal(spinnerShown);
        message.first('#submission-list-message-text').text().should.equal(text);
      };

      it('loads a single submission', () => {
        let tested = false;
        createSubmissions(1);
        return loadSubmissionList()
          .beforeEachResponse((component, request) => {
            if (!request.url.includes('.svc/Submissions')) return;
            checkMessage(component, true, 'Loading 1 Submission…');
            tested = true;
          })
          .then(() => {
            tested.should.be.true();
          });
      });

      it('loads all submissions if there are few of them', () => {
        let tested = false;
        createSubmissions(2);
        return loadSubmissionList()
          .beforeEachResponse((component, request) => {
            if (!request.url.includes('.svc/Submissions')) return;
            checkMessage(component, true, 'Loading 2 Submissions…');
            tested = true;
          })
          .then(() => {
            tested.should.be.true();
          });
      });

      it('initially loads only the first chunk if there are many submissions', () => {
        let tested = false;
        createSubmissions(3);
        return loadSubmissionList([2])
          .beforeEachResponse((component, request) => {
            if (!request.url.includes('.svc/Submissions')) return;
            checkMessage(component, true, 'Loading the first 2 of 3 Submissions…');
            checkTopSkip(request, 2, 0);
            tested = true;
          })
          .afterResponses(component => {
            tested.should.be.true();
            checkIds(component, 2);
          });
      });

      it('shows the total in the download button even if there are multiple chunks', () => {
        createSubmissions(10);
        return loadSubmissionList([2]).afterResponses(component => {
          const button = component.first('#submission-list-download-button');
          button.text().trim().iTrim().should.equal('Download all 10 records');
        });
      });

      it('clicking refresh button loads only first chunk of submissions', () => {
        createSubmissions(3);
        return loadSubmissionList([2])
          .complete()
          .request(component => trigger.click(component, '.btn-refresh'))
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
          let tested = false;
          createSubmissions(12);
          // Chunk 1
          return loadSubmissionList([2, 3])
            .beforeEachResponse((component, request) => {
              if (!request.url.includes('.svc/Submissions')) return;
              checkMessage(component, true, 'Loading the first 2 of 12 Submissions…');
              tested = true;
            })
            .afterResponses(component => {
              tested.should.be.true();
              checkMessage(component, false, '10 rows remain.');
            })
            // Chunk 2
            .request(component => {
              component.vm.onScroll();
            })
            .beforeEachResponse((component, request) => {
              checkTopSkip(request, 2, 2);
              checkMessage(component, true, 'Loading 2 more of 10 remaining Submissions…');
            })
            .respondWithData(() => testData.submissionOData(2, 2))
            .afterResponse(component => {
              checkIds(component, 4);
              checkMessage(component, false, '8 rows remain.');
            })
            // Chunk 3
            .request(component => {
              component.vm.onScroll();
            })
            .beforeEachResponse((component, request) => {
              checkTopSkip(request, 2, 4);
              checkMessage(component, true, 'Loading 2 more of 8 remaining Submissions…');
            })
            .respondWithData(() => testData.submissionOData(2, 4))
            .afterResponse(component => {
              checkIds(component, 6);
              checkMessage(component, false, '6 rows remain.');
            })
            // Chunk 4 (last small chunk)
            .request(component => {
              component.vm.onScroll();
            })
            .beforeEachResponse((component, request) => {
              checkTopSkip(request, 2, 6);
              checkMessage(component, true, 'Loading 2 more of 6 remaining Submissions…');
            })
            .respondWithData(() => testData.submissionOData(2, 6))
            .afterResponse(component => {
              checkIds(component, 8);
              checkMessage(component, false, '4 rows remain.');
            })
            // Chunk 5
            .request(component => {
              component.vm.onScroll();
            })
            .beforeEachResponse((component, request) => {
              checkTopSkip(request, 3, 8);
              checkMessage(component, true, 'Loading 3 more of 4 remaining Submissions…');
            })
            .respondWithData(() => testData.submissionOData(3, 8))
            .afterResponse(component => {
              checkIds(component, 11);
              checkMessage(component, false, '1 row remains.');
            })
            // Chunk 6
            .request(component => {
              component.vm.onScroll();
            })
            .beforeEachResponse((component, request) => {
              checkTopSkip(request, 3, 11);
              checkMessage(component, true, 'Loading the last Submission…');
            })
            .respondWithData(() => testData.submissionOData(3, 11))
            .afterResponse(component => {
              checkIds(component, 12);
              component.find('#submission-list-message').should.be.empty();
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
                chunkSizes: { small: 1, large: 1000 },
                scrolledToBottom: () => true
              }
            })
            .respondWithData(() => testData.standardKeys.sorted())
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
                chunkSizes: { small: 1, large: 1000 },
                scrolledToBottom: () => true
              }
            })
            .respondWithProblem()
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
                chunkSizes: { small: 1, large: 1000 },
                scrolledToBottom: () => true
              }
            })
            .respondWithData(() => testData.standardKeys.sorted())
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
                chunkSizes: { small: 1, large: 1000 },
                scrolledToBottom: () => true
              }
            })
            .respondWithData(() => testData.standardKeys.sorted())
            .respondWithData(() => testData.extendedForms.last()._fields)
            .respondWithProblem()
            .complete()
            .testNoRequest(component => {
              component.vm.onScroll();
            }));

        it('does nothing after user scrolls somewhere other than bottom of page', () => {
          createSubmissions(5);
          return loadSubmissionList([2], false)
            .complete()
            .testNoRequest(component => {
              component.vm.onScroll();
            });
        });

        it('clicking refresh button loads first chunk, even after scrolling', () => {
          createSubmissions(5);
          return loadSubmissionList([2])
            .complete()
            .request(component => {
              component.vm.onScroll();
            })
            .respondWithData(() => testData.submissionOData(2, 2))
            .complete()
            .request(component => trigger.click(component, '.btn-refresh'))
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
          return loadSubmissionList([2])
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
            .request(component => trigger.click(component, '.btn-refresh'))
            .beforeAnyResponse(component => {
              // Should not send a request.
              component.vm.onScroll();
            })
            .respondWithData(() => testData.submissionOData(2, 0));
        });

        it('scrolling has no effect after all submissions have been loaded', () => {
          createSubmissions(2);
          return loadSubmissionList([2])
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
              const button = app.first('#submission-list-download-button');
              const text = button.text().trim().iTrim();
              text.should.equal('Download all 10 records');
            })
            .request(app => trigger.click(app, '.btn-refresh'))
            .respondWithData(() => {
              testData.extendedSubmissions.createPast(1);
              return testData.submissionOData();
            })
            .afterResponses(app => {
              const button = app.first('#submission-list-download-button');
              const text = button.text().trim().iTrim();
              text.should.equal('Download all 11 records');
            });
        });

        it.skip('scrolling to the bottom continues to fetch the next chunk', () => {
          createSubmissions(4);
          // 4 submissions exist. About to request $top=2, $skip=0.
          return loadSubmissionList([2])
            .beforeEachResponse((component, config, index) => {
              if (index === 2) {
                checkTopSkip(config, 2, 0);
                checkMessage(component, true, 'Loading the first 2 of 4 Submissions…');
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
              checkMessage(component, true, 'Loading the last 2 Submissions…');
            })
            .respondWithData(() => {
              testData.extendedSubmissions.createPast(4);
              // This returns 2 of the 4 new submissions.
              return testData.submissionOData(2, 2);
            })
            .afterResponse(component => {
              checkIds(component, 2, 4);
              checkMessage(component, false, '2 rows remain.');
            })
            // 8 submissions exist. About to request $top=2, $skip=4.
            .request(component => {
              component.vm.onScroll();
            })
            .beforeEachResponse((component, config) => {
              checkTopSkip(config, 2, 4);
              checkMessage(component, true, 'Loading the last 2 Submissions…');
            })
            // Returns the 2 submissions that are already shown in the table.
            .respondWithData(() => testData.submissionOData(2, 4))
            .afterResponse(component => {
              checkIds(component, 2, 4);
              checkMessage(component, false, '2 rows remain.');
            })
            // 8 submissions exist. About to request $top=2, $skip=6.
            .request(component => {
              component.vm.onScroll();
            })
            .beforeEachResponse((component, config) => {
              checkTopSkip(config, 2, 6);
              checkMessage(component, true, 'Loading the last 2 Submissions…');
            })
            // Returns the last 2 submissions.
            .respondWithData(() => testData.submissionOData(2, 6))
            .afterResponse(component => {
              checkIds(component, 4, 4);
              component.find('#submission-list-message').length.should.equal(0);
            })
            // 8 submissions exist. No request will be sent.
            .testNoRequest(component => {
              component.vm.onScroll();
            });
        });

        it.skip('does not update originalCount', () => {
          testData.extendedForms.createPast(1, { submissions: 2 });
          testData.extendedSubmissions.createPast(2);
          return loadSubmissionList([1])
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

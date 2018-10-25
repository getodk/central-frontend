import { DateTime, Settings } from 'luxon';

import Form from '../../../../lib/presenters/form';
import FormSubmissionList from '../../../../lib/components/form/submission/list.vue';
import testData from '../../../data';
import { formatDate, uniqueSequence } from '../../../../lib/util';
import { mockHttp, mockRoute } from '../../../http';
import { mockLogin, mockRouteThroughLogin } from '../../../session';
import { trigger } from '../../../event';

const submissionsPath = (form) => `/forms/${form.xmlFormId}/submissions`;

describe('FormSubmissionList', () => {
  describe('routing', () => {
    it('anonymous user is redirected to login', () =>
      mockRoute(submissionsPath(testData.extendedForms.createPast(1).first()))
        .restoreSession(false)
        .afterResponse(app => app.vm.$route.path.should.equal('/login')));

    it('after login, user is redirected back', () => {
      const form = testData.extendedForms
        .createPast(1, { submissions: 0 })
        .last();
      const path = submissionsPath(form);
      return mockRouteThroughLogin(path)
        .respondWithData(() => form)
        .respondWithData(() => testData.extendedFormAttachments.sorted())
        .respondWithData(() => form._schema)
        .respondWithData(testData.submissionOData)
        .afterResponses(app => app.vm.$route.path.should.equal(path));
    });
  });

  describe('after login', () => {
    beforeEach(mockLogin);

    const form = () => testData.extendedForms.firstOrCreatePast();
    const loadSubmissions = (
      count,
      factoryOptions = {},
      chunkSizes = [],
      scrolledToBottom = true
    ) => {
      if (testData.extendedForms.size === 0)
        testData.extendedForms.createPast(1, { submissions: count });
      else if (form().submissions !== count)
        throw new Error('form().submissions and count are inconsistent');
      testData.extendedSubmissions.createPast(count, factoryOptions);
      const [small = 250, large = 1000] = chunkSizes;
      return mockHttp()
        .mount(FormSubmissionList, {
          propsData: {
            form: new Form(form()),
            chunkSizes: { small, large },
            scrolledToBottom: () => scrolledToBottom
          }
        })
        .respondWithData(() => form()._schema)
        .respondWithData(() => testData.submissionOData(small, 0));
    };

    describe('table data', () => {
      it('contains the correct data for the left half of the table', () =>
        loadSubmissions(2).afterResponses(page => {
          const tr = page.find('#form-submission-list-table1 tbody tr');
          const submissions = testData.extendedSubmissions.sorted();
          tr.length.should.equal(submissions.length);
          for (let i = 0; i < tr.length; i += 1) {
            const td = tr[i].find('td');
            td.length.should.equal(3);
            const submission = submissions[i];
            td[0].text().trim().should.equal((i + 1).toString());
            td[1].text().trim().should.equal(submission.submitter != null
              ? submission.submitter.displayName
              : '');
            td[2].text().trim().should.equal(formatDate(submission.createdAt));
          }
        }));

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
          testData.extendedForms
            .createPast(1, { hasInstanceId: true, submissions: 1 });
          return loadSubmissions(1).afterResponses(component => {
            const th = component.find('#form-submission-list-table2 th');
            th.map(wrapper => wrapper.text().trim()).should.eql(headers);
          });
        });

        it('contains the correct instance IDs', () =>
          loadSubmissions(2).afterResponses(component => {
            const tr = component.find('#form-submission-list-table2 tbody tr');
            const submissions = testData.extendedSubmissions.sorted();
            tr.length.should.equal(submissions.length);
            for (let i = 0; i < tr.length; i += 1) {
              const td = tdByRowAndColumn(tr[i], 'Instance ID');
              td.text().trim().should.equal(submissions[i].instanceId);
            }
          }));

        it('correctly formats int values', () =>
          loadSubmissions(1, { hasInt: true }).afterResponses(component => {
            const td = tdByRowAndColumn(
              component.first('#form-submission-list-table2 tbody tr'),
              'testInt'
            );
            const submission = testData.extendedSubmissions.last();
            const localeString = submission._oData.testInt.toLocaleString();
            td.text().trim().should.equal(localeString);
            td.hasClass('form-submission-list-int-column').should.be.true();
          }));

        describe('decimal values', () => {
          it('adds the correct class', () =>
            loadSubmissions(1, { hasDecimal: true })
              .afterResponses(component => {
                const td = tdByRowAndColumn(
                  component.first('#form-submission-list-table2 tbody tr'),
                  'testDecimal'
                );
                td.hasClass('form-submission-list-decimal-column').should.be.true();
              }));

          // Array of test cases, where each case is an array with the following
          // structure:
          // [raw value, expected formatted value]
          const cases = [
            [1234, '1,234'],
            [1234.5678901234, '1,234.5678901234'],
            [-1234.567890123, '-1,234.567890123'],
            [1234.56789012345, '1,234.5678901235'],
            [-1234.56789012345, '-1,234.567890123'],
            [1.2, '1.2'],
            [-1.2, '-1.2'],
            [0.0000000000001, '0.0000000000001'],
            [0.00000000000001, '0'],
            [-0.000000000001, '-0.000000000001'],
            [-0.0000000000001, '-0']
          ];
          for (const [testDecimal, localeString] of cases) {
            it(`correctly formats ${testDecimal}`, () =>
              loadSubmissions(1, { testDecimal }).afterResponses(component => {
                const td = tdByRowAndColumn(
                  component.first('#form-submission-list-table2 tbody tr'),
                  'testDecimal'
                );
                td.text().trim().should.equal(localeString);
              }));
          }
        });

        it('correctly formats string values', () =>
          loadSubmissions(1, { hasStrings: true }).afterResponses(component => {
            const td = tdByRowAndColumn(
              component.first('#form-submission-list-table2 tbody tr'),
              'testString1'
            );
            const { testString1 } = testData.extendedSubmissions.last()._oData;
            td.text().trim().should.equal(testString1.trim());
            td.getAttribute('title').should.equal(testString1);
          }));

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
            it(`correctly formats ${testDate}`, () =>
              loadSubmissions(1, { testDate }).afterResponses(component => {
                const td = tdByRowAndColumn(
                  component.first('#form-submission-list-table2 tbody tr'),
                  'testDate'
                );
                td.text().trim().should.equal(formatted);
              }));
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
          for (const [defaultZoneName, nowISO, testTime, formatted] of cases) {
            it(`correctly formats ${testTime}`, () => {
              const originalDefaultZoneName = Settings.defaultZoneName;
              Settings.defaultZoneName = defaultZoneName;
              const originalNow = Settings.now;
              if (nowISO != null) {
                const nowMillis = DateTime.fromISO(nowISO).toMillis();
                Settings.now = () => nowMillis;
              }
              return loadSubmissions(1, { testTime })
                .afterResponses(component => {
                  const td = tdByRowAndColumn(
                    component.first('#form-submission-list-table2 tbody tr'),
                    'testTime'
                  );
                  td.text().trim().should.equal(formatted);
                })
                .finally(() => {
                  Settings.defaultZoneName = originalDefaultZoneName;
                  if (nowISO != null) Settings.now = originalNow;
                });
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
          for (const [defaultZoneName, nowISO, testDateTime, formatted] of cases) {
            it(`correctly formats ${testDateTime}`, () => {
              const originalDefaultZoneName = Settings.defaultZoneName;
              Settings.defaultZoneName = defaultZoneName;
              const originalNow = Settings.now;
              if (nowISO != null) {
                const nowMillis = DateTime.fromISO(nowISO).toMillis();
                Settings.now = () => nowMillis;
              }
              return loadSubmissions(1, { testDateTime })
                .afterResponses(component => {
                  const td = tdByRowAndColumn(
                    component.first('#form-submission-list-table2 tbody tr'),
                    'testDateTime'
                  );
                  td.text().trim().should.equal(formatted);
                })
                .finally(() => {
                  Settings.defaultZoneName = originalDefaultZoneName;
                  if (nowISO != null) Settings.now = originalNow;
                });
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
            it(`correctly formats ${testGeopoint.coordinates.join(' ')}`, () =>
              loadSubmissions(1, { testGeopoint }).afterResponses(component => {
                const td = tdByRowAndColumn(
                  component.first('#form-submission-list-table2 tbody tr'),
                  'testGeopoint'
                );
                td.text().trim().should.equal(formatted);
              }));
          }
        });

        it('correctly formats binary values', () =>
          loadSubmissions(1, { instanceId: 'abc 123', testGroup: { testBinary: 'def 456.jpg' } })
            .afterResponses(component => {
              const td = tdByRowAndColumn(
                component.first('#form-submission-list-table2 tbody tr'),
                'testGroup-testBinary'
              );
              td.hasClass('form-submission-list-binary-column').should.be.true();
              const $a = $(td.element).find('a');
              $a.length.should.equal(1);
              const encodedFormId = encodeURIComponent(form().xmlFormId);
              $a.attr('href').should.equal(`/v1/forms/${encodedFormId}/submissions/abc%20123/attachments/def%20456.jpg`);
              $a.find('.icon-check').length.should.equal(1);
              $a.find('.icon-download').length.should.equal(1);
            }));
      });
    });

    describe('field subset indicator', () => {
      const id = uniqueSequence();
      const fields = (type, count) => new Array(count).fill(null)
        .map(() => ({ path: [`field${id()}`], type }));

      // Array of test cases
      const cases = [
        // Schemas for which an indicator is not expected
        [false, [
          ['1 field', fields('int', 1)],
          ['10 fields', fields('int', 10)],
          ['10 fields and meta.instanceID', [
            ...fields('int', 10),
            { path: ['meta', 'instanceID'], type: 'string' }
          ]],
          ['10 fields and instanceID', [
            ...fields('int', 10),
            { path: ['instanceID'], type: 'string' }
          ]],
          ['10 fields, meta.instanceID, and instanceID', [
            ...fields('int', 10),
            { path: ['meta', 'instanceID'], type: 'string' },
            { path: ['instanceID'], type: 'string' }
          ]]
        ]],
        // Schemas for which an indicator is expected
        [true, [
          ['11 fields', fields('int', 11)],
          ['1 field and 1 repeat', [
            ...fields('int', 1),
            ...fields('repeat', 1)
          ]],
          ['1 repeat and no other root fields', fields('repeat', 1)]
        ]]
      ];
      for (const [hasClass, subcases] of cases) {
        describe(hasClass ? 'is shown' : 'is not shown', () => {
          for (const [description, schema] of subcases) {
            it(description, () => {
              testData.extendedForms.createPast(1, { schema, submissions: 1 });
              return loadSubmissions(1).afterResponses(component => {
                component
                  .first('#form-submission-list-table2')
                  .hasClass('form-submission-list-field-subset')
                  .should
                  .equal(hasClass);
              });
            });
          }
        });
      }
    });

    describe('refresh button', () => {
      for (let i = 1; i <= 2; i += 1) {
        it(`refreshes part ${i} of table after refresh button is clicked`, () =>
          mockRoute(submissionsPath(form()))
            .respondWithData(form)
            .respondWithData(() => testData.extendedFormAttachments.sorted())
            .respondWithData(() => form()._schema)
            .testRefreshButton({
              collection: testData.extendedSubmissions,
              respondWithData: testData.submissionOData,
              tableSelector: `#form-submission-list-table${i}`
            }));
      }

      it('disables the download button', () =>
        loadSubmissions(1)
          .afterResponses(component =>
            component.first('#form-submission-list-download-button')
              .hasClass('disabled').should.be.false())
          .request(component => trigger.click(component, '.btn-refresh'))
          .beforeEachResponse(component =>
            component.first('#form-submission-list-download-button')
              .hasClass('disabled').should.be.true())
          .respondWithData(testData.submissionOData)
          .afterResponse(component =>
            component.first('#form-submission-list-download-button')
              .hasClass('disabled').should.be.false()));
    });

    describe('load by chunk', () => {
      const checkTopSkip = (request, top, skip) => {
        request.url.should.match(new RegExp(`%24top=${top}(&|$)`));
        request.url.should.match(new RegExp(`%24skip=${skip}(&|$)`));
      };
      const checkIds = (component, count) => {
        const rows = component.find('#form-submission-list-table2 tbody tr');
        rows.length.should.equal(count);
        const submissions = testData.extendedSubmissions.sorted();
        submissions.length.should.be.aboveOrEqual(count);
        for (let i = 0; i < rows.length; i += 1) {
          const cells = rows[i].find('td');
          const lastCell = cells[cells.length - 1];
          lastCell.text().trim().should.equal(submissions[i].instanceId);
        }
      };

      it('initially loads only the first chunk of submissions', () =>
        loadSubmissions(3, {}, [2])
          .beforeEachResponse((component, request, index) => {
            if (index === 1) checkTopSkip(request, 2, 0);
          })
          .afterResponses(component => {
            checkIds(component, 2);
          }));

      it('clicking the refresh button loads only the first chunk of submissions', () =>
        loadSubmissions(3, {}, [2])
          .complete()
          .request(component => trigger.click(component, '.btn-refresh'))
          .beforeEachResponse((component, request) => {
            checkTopSkip(request, 2, 0);
          })
          .respondWithData(() => testData.submissionOData(2, 0))
          .afterResponse(component => {
            checkIds(component, 2);
          }));

      describe('scrolling', () => {
        it('scrolling to the bottom loads the next chunk of submissions', () =>
          // Chunk 1
          loadSubmissions(12, {}, [2, 3])
            .complete()
            // Chunk 2
            .request(component => {
              component.vm.onScroll();
            })
            .beforeEachResponse((component, request) => {
              checkTopSkip(request, 2, 2);
            })
            .respondWithData(() => testData.submissionOData(2, 2))
            .afterResponse(component => {
              checkIds(component, 4);
            })
            // Chunk 3
            .request(component => {
              component.vm.onScroll();
            })
            .beforeEachResponse((component, request) => {
              checkTopSkip(request, 2, 4);
            })
            .respondWithData(() => testData.submissionOData(2, 4))
            .afterResponse(component => {
              checkIds(component, 6);
            })
            // Chunk 4 (last small chunk)
            .request(component => {
              component.vm.onScroll();
            })
            .beforeEachResponse((component, request) => {
              checkTopSkip(request, 2, 6);
            })
            .respondWithData(() => testData.submissionOData(2, 6))
            .afterResponse(component => {
              checkIds(component, 8);
            })
            // Chunk 5
            .request(component => {
              component.vm.onScroll();
            })
            .beforeEachResponse((component, request) => {
              checkTopSkip(request, 3, 8);
            })
            .respondWithData(() => testData.submissionOData(3, 8))
            .afterResponse(component => {
              checkIds(component, 11);
            }));

        it('scrolling elsewhere does nothing', () =>
          loadSubmissions(5, {}, [2], false)
            .complete()
            .request(component => {
              component.vm.onScroll();
            }));

        it('clicking refresh button loads first chunk, even after scrolling', () =>
          loadSubmissions(5, {}, [2])
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
            .respondWithData(() => testData.submissionOData(2, 2)));

        it('scrolling to the bottom has no effect if awaiting response', () =>
          loadSubmissions(5, {}, [2])
            .complete()
            .request(component => {
              // Sends a request.
              component.vm.onScroll();
            })
            .beforeEachResponse(component => {
              // Should not send a request.
              component.vm.onScroll();
            })
            .respondWithData(() => testData.submissionOData(2, 2))
            .complete()
            .request(component => trigger.click(component, '.btn-refresh'))
            .beforeEachResponse(component => {
              // Should not send a request.
              component.vm.onScroll();
            })
            .respondWithData(() => testData.submissionOData(2, 0)));

        it('scrolling has no effect after all submissions have been loaded', () =>
          loadSubmissions(2, {}, [2])
            .complete()
            .request(component => {
              component.vm.onScroll();
            }));
      });
    });

    describe('download button', () => {
      it('shows the number of submissions', () =>
        loadSubmissions(2)
          .afterResponses(page => {
            const button = page.first('#form-submission-list-download-button');
            const text = button.text().trim().replace(/\s+/g, ' ');
            const count = testData.extendedSubmissions.size;
            text.should.equal(`Download all ${count} records`);
          }));

      it('has the correct href', () =>
        loadSubmissions(1)
          .afterResponses(page => {
            const button = page.first('#form-submission-list-download-button');
            const $button = $(button.element);
            $button.prop('tagName').should.equal('A');
            const encodedFormId = encodeURIComponent(form().xmlFormId);
            $button.attr('href').should.equal(`/v1/forms/${encodedFormId}/submissions.csv.zip`);
          }));
    });

    describe('no submissions', () => {
      it('shows a message', () =>
        loadSubmissions(0)
          .afterResponses(component => {
            const text = component.first('p').text().trim();
            text.should.startWith('There are no submissions yet');
          }));

      it('does not show the download button', () =>
        loadSubmissions(0)
          .afterResponses(component => {
            component.find('#form-submission-list-download-button').should.be.empty();
          }));

      it('does not show the analyze button', () =>
        loadSubmissions(0)
          .afterResponses(component => {
            component.find('#form-submission-list-analyze-button').should.be.empty();
          }));
    });
  });
});

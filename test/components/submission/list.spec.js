import FormShow from '../../../src/components/form/show.vue';
import SubmissionList from '../../../src/components/submission/list.vue';
import Spinner from '../../../src/components/spinner.vue';
import testData from '../../data';
import { formatDate, uniqueSequence } from '../../../src/util/util';
import { mockHttp, mockRoute } from '../../http';
import { mockLogin, mockRouteThroughLogin } from '../../session';
import { setLuxon } from '../../util/util';
import { trigger } from '../../event';

describe('SubmissionList', () => {
  describe('routing', () => {
    it('anonymous user is redirected to login', () =>
      mockRoute('/projects/1/forms/f/submissions')
        .restoreSession(false)
        .afterResponse(app => {
          app.vm.$route.path.should.equal('/login');
        }));

    it('after login, user is redirected back', () =>
      mockRouteThroughLogin('/projects/1/forms/f/submissions')
        .respondWithData(() => testData.extendedProjects.createPast(1).last())
        .respondWithData(() => testData.extendedForms
          .createPast(1, { xmlFormId: 'f', submissions: 0 })
          .last())
        .respondWithData(() => testData.extendedFormAttachments.sorted())
        .respondWithData(() => testData.standardKeys.sorted())
        .respondWithData(() => testData.extendedForms.last()._schema)
        .respondWithData(testData.submissionOData)
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/projects/1/forms/f/submissions');
        }));

    describe('after login', () => {
      beforeEach(mockLogin);

      it('requests schema for a user whose first navigation is to the tab', () =>
        mockRoute('/projects/1/forms/f/submissions')
          .beforeEachResponse((app, request, index) => {
            if (index === 4)
              request.url.should.equal('/v1/projects/1/forms/f.schema.json?flatten=true&odata=true');
          })
          .respondWithData(() => testData.extendedProjects.createPast(1).last())
          .respondWithData(() => testData.extendedForms
            .createPast(1, { xmlFormId: 'f', submissions: 0 })
            .last())
          .respondWithData(() => testData.extendedFormAttachments.sorted())
          .respondWithData(() => testData.standardKeys.sorted())
          .respondWithData(() => testData.extendedForms.last()._schema)
          .respondWithData(testData.submissionOData));

      it('requests schema for a user who navigates to the tab from another tab', () =>
        mockRoute('/projects/1/forms/f')
          .respondWithData(() => testData.extendedProjects.createPast(1).last())
          .respondWithData(() => testData.extendedForms
            .createPast(1, { xmlFormId: 'f', submissions: 0 })
            .last())
          .respondWithData(() => testData.extendedFormAttachments.sorted())
          .respondWithData(() => []) // assignmentActors
          .complete()
          .route('/projects/1/forms/f/submissions')
          .beforeEachResponse((app, request, index) => {
            if (index === 1)
              request.url.should.equal('/v1/projects/1/forms/f.schema.json?flatten=true&odata=true');
          })
          .respondWithData(() => testData.standardKeys.sorted())
          .respondWithData(() => testData.extendedForms.last()._schema)
          .respondWithData(testData.submissionOData));

      it('resets and updates the component after the route updates', () =>
        mockRoute('/projects/1/forms/f1/submissions')
          .beforeEachResponse((app, request, index) => {
            if (index === 4)
              request.url.should.equal('/v1/projects/1/forms/f1.schema.json?flatten=true&odata=true');
          })
          .respondWithData(() => testData.extendedProjects.createPast(1).last())
          .respondWithData(() => testData.extendedForms
            .createPast(1, { xmlFormId: 'f1', submissions: 1 })
            .last())
          .respondWithData(() => testData.extendedFormAttachments.sorted())
          .respondWithData(() => testData.standardKeys.sorted())
          .respondWithData(() => testData.extendedForms.last()._schema)
          .respondWithData(() => {
            testData.extendedSubmissions.createPast(1);
            return testData.submissionOData(1, 0);
          })
          .afterResponses(app => {
            app.first(SubmissionList).data().submissions.length.should.equal(1);
          })
          .route('/projects/1/forms/f2/submissions')
          .beforeAnyResponse(app => {
            should.not.exist(app.first(SubmissionList).data().submissions);
          })
          .beforeEachResponse((app, request, index) => {
            if (index === 3)
              request.url.should.equal('/v1/projects/1/forms/f2.schema.json?flatten=true&odata=true');
          })
          .respondWithData(() => testData.extendedForms
            .createPast(1, { xmlFormId: 'f2', submissions: 2 })
            .last())
          .respondWithData(() => testData.extendedFormAttachments.sorted())
          .respondWithData(() => testData.standardKeys.sorted())
          .respondWithData(() => testData.extendedForms.last()._schema)
          .respondWithData(() => {
            const form = testData.extendedForms.last();
            testData.extendedSubmissions.createPast(2, { form });
            return testData.submissionOData(2, 1);
          })
          .afterResponses(app => {
            app.first(SubmissionList).data().submissions.length.should.equal(2);
          }));
    });
  });

  describe('after login', () => {
    beforeEach(mockLogin);

    const form = () => {
      testData.extendedForms.size.should.equal(1);
      return testData.extendedForms.last();
    };
    const encodedFormId = () => encodeURIComponent(form().xmlFormId);
    // Create submissions along with the associated project and form.
    const createSubmissions = (count, factoryOptions = {}) => {
      testData.extendedProjects.size.should.equal(0);
      testData.extendedForms.size.should.equal(0);
      testData.extendedSubmissions.size.should.equal(0);

      testData.extendedProjects.createPast(1);
      testData.extendedForms.createPast(1, { submissions: count });
      testData.extendedSubmissions.createPast(count, factoryOptions);
    };
    const loadSubmissionList = (chunkSizes = [], scrolledToBottom = true) => {
      // Check test data.
      testData.extendedProjects.size.should.equal(1);
      testData.extendedForms.size.should.equal(1);
      const formSubmissionCount = testData.extendedForms.last().submissions;
      formSubmissionCount.should.equal(testData.extendedSubmissions.size);

      const [small = 250, large = 1000] = chunkSizes;
      return mockHttp()
        .mount(SubmissionList, {
          propsData: {
            projectId: '1',
            xmlFormId: testData.extendedForms.last().xmlFormId,
            chunkSizes: { small, large },
            scrolledToBottom: () => scrolledToBottom
          },
          requestData: { form: testData.extendedForms.last() }
        })
        .request(component => {
          // Normally the `activated` hook calls this method, but that hook is
          // not called here, so we call the method ourselves instead.
          component.vm.fetchInitialData();
        })
        .respondWithData(() => testData.standardKeys.sorted())
        .respondWithData(() => testData.extendedForms.last()._schema)
        .respondWithData(() => testData.submissionOData(small, 0));
    };

    it('does not send a new request if user navigates back to tab', () =>
      mockRoute('/projects/1/forms/f/submissions')
        .respondWithData(() => testData.extendedProjects.createPast(1).last())
        .respondWithData(() => testData.extendedForms
          .createPast(1, { xmlFormId: 'f', submissions: 0 })
          .last())
        .respondWithData(() => testData.extendedFormAttachments.sorted())
        .respondWithData(() => testData.standardKeys.sorted())
        .respondWithData(() => testData.extendedForms.last()._schema)
        .respondWithData(testData.submissionOData)
        .complete()
        .route('/projects/1/forms/f')
        .respondWithData(() => []) // assignmentActors
        .complete()
        .route('/projects/1/forms/f/submissions')
        .respondWithData([/* no responses */]));

    describe('table data', () => {
      it('contains the correct data for the left half of the table', () => {
        createSubmissions(2);
        return loadSubmissionList().afterResponses(page => {
          const tr = page.find('#submission-table1 tbody tr');
          const submissions = testData.extendedSubmissions.sorted();
          tr.length.should.equal(submissions.length);
          for (let i = 0; i < tr.length; i += 1) {
            const td = tr[i].find('td');
            td.length.should.equal(3);
            const submission = submissions[i];
            const rowNumber = testData.extendedSubmissions.size - i;
            td[0].text().trim().should.equal(rowNumber.toString());
            td[1].text().trim().should.equal(submission.submitter != null
              ? submission.submitter.displayName
              : '');
            td[2].text().trim().should.equal(formatDate(submission.createdAt));
          }
        });
      });

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
            td.hasClass('submission-row-int-column').should.be.true();
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
                td.hasClass('submission-row-decimal-column').should.be.true();
              });
          });

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

        it('correctly formats binary values', () => {
          createSubmissions(1, {
            instanceId: 'abc 123',
            testGroup: { testBinary: 'def 456.jpg' }
          });
          return loadSubmissionList()
            .afterResponses(component => {
              const td = tdByRowAndColumn(
                component.first('#submission-table2 tbody tr'),
                'testGroup-testBinary'
              );
              td.hasClass('submission-row-binary-column').should.be.true();
              const $a = $(td.element).find('a');
              $a.length.should.equal(1);
              $a.attr('href').should.equal(`/v1/projects/1/forms/${encodedFormId()}/submissions/abc%20123/attachments/def%20456.jpg`);
              $a.find('.icon-check').length.should.equal(1);
              $a.find('.icon-download').length.should.equal(1);
            });
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
        const schema = [{ path: ['meta', 'instanceID'], type: 'string' }];
        testData.extendedForms.createPast(1, { schema, submissions: 1 });
        testData.extendedSubmissions.createPast(1, { status: 'NotDecrypted' });
        return loadSubmissionList().afterResponses(component => {
          const td = component.find('#submission-table2 tbody td');
          td.length.should.equal(1);
          should.not.exist(td[0].element.getAttribute('colspan'));
        });
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
              testData.extendedProjects.createPast(1);
              testData.extendedForms.createPast(1, { schema, submissions: 1 });
              testData.extendedSubmissions.createPast(1);
              return loadSubmissionList().afterResponses(component => {
                const table2 = component.first('#submission-table2');
                table2.hasClass('field-subset').should.equal(hasClass);
              });
            });
          }
        });
      }
    });

    it('shows a message if there are no submissions', () => {
      testData.extendedForms.createPast(1, { submissions: 0 });
      return loadSubmissionList().afterResponses(component => {
        component.find('.empty-table-message').length.should.equal(1);
      });
    });

    describe('refresh button', () => {
      for (let i = 1; i <= 2; i += 1) {
        it(`refreshes part ${i} of table after refresh button is clicked`, () => {
          testData.extendedProjects.createPast(1);
          testData.extendedForms.createPast(1);
          return mockRoute(`/projects/1/forms/${encodedFormId()}/submissions`)
            .respondWithData(() => testData.extendedProjects.last())
            .respondWithData(form)
            .respondWithData(() => testData.extendedFormAttachments.sorted())
            .respondWithData(() => testData.standardKeys.sorted())
            .respondWithData(() => form()._schema)
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
            $button.attr('href').should.equal(`/v1/projects/1/forms/${encodedFormId()}/submissions.csv.zip`);
          });
      });
    });

    describe('load by chunk', () => {
      const checkTopSkip = (request, top, skip) => {
        request.url.should.match(new RegExp(`%24top=${top}(&|$)`));
        request.url.should.match(new RegExp(`%24skip=${skip}(&|$)`));
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
            checkMessage(component, true, 'Loading 1 submission…');
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
            checkMessage(component, true, 'Loading 2 submissions…');
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
            checkMessage(component, true, 'Loading the first 2 of 3 submissions…');
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
              checkMessage(component, true, 'Loading the first 2 of 12 submissions…');
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
              checkMessage(component, true, 'Loading 2 more of 10 remaining submissions…');
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
              checkMessage(component, true, 'Loading 2 more of 8 remaining submissions…');
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
              checkMessage(component, true, 'Loading 2 more of 6 remaining submissions…');
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
              checkMessage(component, true, 'Loading 3 more of 4 remaining submissions…');
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
              checkMessage(component, true, 'Loading the last submission…');
            })
            .respondWithData(() => testData.submissionOData(3, 11))
            .afterResponse(component => {
              checkIds(component, 12);
              component.find('#submission-list-message').should.be.empty();
            });
        });

        it('does nothing upon scroll if keys request results in error', () =>
          mockHttp()
            .mount(SubmissionList, {
              propsData: {
                projectId: '1',
                xmlFormId: 'f',
                chunkSizes: { small: 1, large: 1000 },
                scrolledToBottom: () => true
              },
              requestData: {
                form: testData.extendedForms
                  .createPast(1, { xmlFormId: 'f', submissions: 2 })
                  .last()
              }
            })
            .request(component => {
              component.vm.fetchInitialData();
            })
            .respondWithProblem()
            .respondWithData(() => testData.extendedForms.last()._schema)
            .respondWithData(() => {
              testData.extendedSubmissions.createPast(2);
              return testData.submissionOData(1, 0);
            })
            .complete()
            .request(component => {
              component.vm.onScroll();
            })
            .respondWithData([/* no responses */]));

        it('does nothing upon scroll if schema request results in error', () =>
          mockHttp()
            .mount(SubmissionList, {
              propsData: {
                projectId: '1',
                xmlFormId: 'f',
                chunkSizes: { small: 1, large: 1000 },
                scrolledToBottom: () => true
              },
              requestData: {
                form: testData.extendedForms
                  .createPast(1, { xmlFormId: 'f', submissions: 2 })
                  .last()
              }
            })
            .request(component => {
              component.vm.fetchInitialData();
            })
            .respondWithData(() => testData.standardKeys.sorted())
            .respondWithProblem()
            .respondWithData(() => {
              testData.extendedSubmissions.createPast(2);
              return testData.submissionOData(1, 0);
            })
            .complete()
            .request(component => {
              component.vm.onScroll();
            })
            .respondWithData([/* no responses */]));

        it('does nothing upon scroll if submissions request results in error', () =>
          mockHttp()
            .mount(SubmissionList, {
              propsData: {
                projectId: '1',
                xmlFormId: 'f',
                chunkSizes: { small: 1, large: 1000 },
                scrolledToBottom: () => true
              },
              requestData: {
                form: testData.extendedForms
                  .createPast(1, { xmlFormId: 'f', submissions: 2 })
                  .last()
              }
            })
            .request(component => {
              component.vm.fetchInitialData();
            })
            .respondWithData(() => testData.standardKeys.sorted())
            .respondWithData(() => testData.extendedForms.last()._schema)
            .respondWithProblem()
            .complete()
            .request(component => {
              component.vm.onScroll();
            })
            .respondWithData([/* no responses */]));

        it('does nothing after user scrolls somewhere other than bottom of page', () => {
          createSubmissions(5);
          return loadSubmissionList([2], false)
            .complete()
            .request(component => {
              component.vm.onScroll();
            })
            .respondWithData([/* no responses */]);
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
        const loadFormOverview = (submissionCount, chunkSizes = []) => {
          createSubmissions(submissionCount);
          const [small = 250, large = 1000] = chunkSizes;
          return mockRoute(`/projects/1/forms/${encodedFormId()}`)
            .respondWithData(() => testData.extendedProjects.last())
            .respondWithData(form)
            .respondWithData(() => testData.extendedFormAttachments.sorted())
            .respondWithData(() => []) // assignmentActors
            .afterResponses(app => {
              const formShow = app.first(FormShow);
              formShow.setData({
                submissionChunkSizes: { small, large },
                scrolledToBottom: () => true
              });
              return app.vm.$nextTick();
            })
            // We want it to be possible for afterResponses() to be chained to
            // this mockHttp() object, but we have already used afterResponses()
            // to call setData(). In a slight abuse of request(), we specify a
            // callback that does not send a request, and we do not specify a
            // response callback, making afterResponses() available again.
            .request(() => {});
        };

        it('updates the form checklist', () =>
          loadFormOverview(10)
            .afterResponses(app => {
              const p = app.find('.form-checklist-step')[2].find('p')[1];
              p.text().should.containEql('10 ');
              p.text().should.not.containEql('11 ');
            })
            .route(`/projects/1/forms/${encodedFormId()}/submissions`)
            .respondWithData(() => testData.standardKeys.sorted())
            .respondWithData(() => form()._schema)
            .respondWithData(() => {
              testData.extendedSubmissions.createPast(1);
              return testData.submissionOData();
            })
            .complete()
            .route(`/projects/1/forms/${encodedFormId()}`)
            .then(app => {
              const p = app.find('.form-checklist-step')[2].find('p')[1];
              p.text().should.containEql('11 ');
              p.text().should.not.containEql('10 ');
            }));

        it('updates the count in the download button', () =>
          loadFormOverview(10)
            .complete()
            .route(`/projects/1/forms/${encodedFormId()}/submissions`)
            .respondWithData(() => testData.standardKeys.sorted())
            .respondWithData(() => form()._schema)
            .respondWithData(testData.submissionOData)
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
            }));

        it('scrolling to the bottom continues to fetch the next chunk', () =>
          loadFormOverview(4, [2])
            .complete()
            // 4 submissions exist. About to request $top=2, $skip=0.
            .route(`/projects/1/forms/${encodedFormId()}/submissions`)
            .respondWithData(() => testData.standardKeys.sorted())
            .respondWithData(() => form()._schema)
            .respondWithData(() => testData.submissionOData(2, 0))
            .complete()
            // 4 submissions exist, but 4 more are about to be created. About to
            // request $top=2, $skip=2.
            .request(app => {
              app.first(SubmissionList).vm.onScroll();
            })
            .beforeEachResponse((app, request) => {
              checkTopSkip(request, 2, 2);
              checkMessage(app, true, 'Loading the last 2 submissions…');
            })
            .respondWithData(() => {
              testData.extendedSubmissions.createPast(4);
              // This returns 2 of the 4 new submissions.
              return testData.submissionOData(2, 2);
            })
            .afterResponse(app => {
              checkIds(app, 2, 4);
              checkMessage(app, false, '2 rows remain.');
            })
            // 8 submissions exist. About to request $top=2, $skip=4.
            .request(app => {
              app.first(SubmissionList).vm.onScroll();
            })
            .beforeEachResponse((app, request) => {
              checkTopSkip(request, 2, 4);
              checkMessage(app, true, 'Loading the last 2 submissions…');
            })
            // Returns the 2 submissions that are already shown in the table.
            .respondWithData(() => testData.submissionOData(2, 4))
            .afterResponse(app => {
              checkIds(app, 2, 4);
              checkMessage(app, false, '2 rows remain.');
            })
            // 8 submissions exist. About to request $top=2, $skip=6.
            .request(app => {
              app.first(SubmissionList).vm.onScroll();
            })
            .beforeEachResponse((app, request) => {
              checkTopSkip(request, 2, 6);
              checkMessage(app, true, 'Loading the last 2 submissions…');
            })
            // Returns the last 2 submissions.
            .respondWithData(() => testData.submissionOData(2, 6))
            .afterResponse(app => {
              checkIds(app, 4, 4);
              app.find('#submission-list-message').should.be.empty();
            })
            // 8 submissions exist. No request will be sent.
            .request(app => {
              app.first(SubmissionList).vm.onScroll();
            }));
      });
    });
  });
});

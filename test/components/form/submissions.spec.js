import axios from 'axios';
import { DateTime, Settings } from 'luxon';

import FormSubmissions from '../../../lib/components/form/submissions.vue';
import testData from '../../data';
import { formatDate } from '../../../lib/util';
import { mockHttp, mockRoute } from '../../http';
import { mockLogin, mockRouteThroughLogin } from '../../session';
import { trigger } from '../../util';

const submissionsPath = (form) => `/forms/${form.xmlFormId}/submissions`;

describe('FormSubmissions', () => {
  describe('routing', () => {
    it('anonymous user is redirected to login', () =>
      mockRoute(submissionsPath(testData.extendedForms.createPast(1).first()))
        .then(app => app.vm.$route.path.should.equal('/login')));

    it('after login, user is redirected back', () => {
      const form = testData.extendedForms.createPast(1).last();
      const path = submissionsPath(form);
      return mockRouteThroughLogin(path)
        .respondWithData(() => form)
        .respondWithData(() => form._schema)
        .respondWithData(() => [])
        .afterResponses(app => app.vm.$route.path.should.equal(path));
    });
  });

  describe('after login', () => {
    beforeEach(mockLogin);

    const form = () => testData.extendedForms.firstOrCreatePast();
    const submissionOData = () => {
      const submissions = testData.extendedSubmissions.sorted();
      return { value: submissions.map(submission => submission._oData) };
    };
    const loadSubmissions = (...args) => {
      testData.extendedSubmissions.createPast(...args);
      return mockHttp()
        .mount(FormSubmissions, {
          propsData: { form: form() }
        })
        .respondWithData(() => form()._schema)
        .respondWithData(submissionOData);
    };

    describe('table data', () => {
      it('contains the correct data for the left half of the table', () =>
        loadSubmissions(2).afterResponses(page => {
          const tr = page.find('#form-submissions-table1 tbody tr');
          const submissions = testData.extendedSubmissions.sorted();
          tr.length.should.equal(submissions.length);
          for (let i = 0; i < tr.length; i += 1) {
            const td = tr[i].find('td');
            td.length.should.equal(2);
            const submission = submissions[i];
            td[0].text().trim().should.equal(submission.submitter != null
              ? submission.submitter.displayName
              : '');
            td[1].text().trim().should.equal(formatDate(submission.createdAt));
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
          testData.extendedForms.createPast(1, { hasInstanceId: true });
          return loadSubmissions(1).afterResponses(component => {
            const th = component.find('#form-submissions-table2 th');
            th.map(wrapper => wrapper.text().trim()).should.eql(headers);
          });
        });

        it('contains the correct instance IDs', () =>
          loadSubmissions(2).afterResponses(component => {
            const tr = component.find('#form-submissions-table2 tbody tr');
            const submissions = testData.extendedSubmissions.sorted();
            tr.length.should.equal(submissions.length);
            for (let i = 0; i < submissions.length; i += 1) {
              const td = tdByRowAndColumn(tr[i], 'Instance ID');
              td.text().trim().should.equal(submissions[i].instanceId);
            }
          }));

        it('correctly formats int values', () =>
          loadSubmissions(1, { hasInt: true }).afterResponses(component => {
            const td = tdByRowAndColumn(
              component.first('#form-submissions-table2 tbody tr'),
              'testInt'
            );
            const submission = testData.extendedSubmissions.last();
            const localeString = submission._oData.testInt.toLocaleString();
            td.text().trim().should.equal(localeString);
            td.hasClass('form-submissions-int-column').should.be.true();
          }));

        describe('decimal values', () => {
          it('adds the correct class', () =>
            loadSubmissions(1, { hasDecimal: true })
              .afterResponses(component => {
                const td = tdByRowAndColumn(
                  component.first('#form-submissions-table2 tbody tr'),
                  'testDecimal'
                );
                td.hasClass('form-submissions-decimal-column').should.be.true();
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
                  component.first('#form-submissions-table2 tbody tr'),
                  'testDecimal'
                );
                td.text().trim().should.equal(localeString);
              }));
          }
        });

        it('correctly formats string values', () =>
          loadSubmissions(1, { hasStrings: true }).afterResponses(component => {
            const td = tdByRowAndColumn(
              component.first('#form-submissions-table2 tbody tr'),
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
                  component.first('#form-submissions-table2 tbody tr'),
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
                    component.first('#form-submissions-table2 tbody tr'),
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
                    component.first('#form-submissions-table2 tbody tr'),
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
                  component.first('#form-submissions-table2 tbody tr'),
                  'testGeopoint'
                );
                td.text().trim().should.equal(formatted);
              }));
          }
        });

        it('correctly formats binary values', () =>
          loadSubmissions(1, { hasBinary: true }).afterResponses(component => {
            const td = tdByRowAndColumn(
              component.first('#form-submissions-table2 tbody tr'),
              'testGroup-testBinary'
            );
            td.find('.icon-check-circle').length.should.equal(1);
            td.hasClass('form-submissions-binary-column').should.be.true();
          }));
      });
    });

    describe('refresh button', () => {
      for (let i = 1; i <= 2; i += 1) {
        it(`refreshes part ${i} of table after refresh button is clicked`, () =>
          mockRoute(submissionsPath(form()))
            .respondWithData(form)
            .testRefreshButton({
              collection: testData.extendedSubmissions,
              respondWithData: [
                () => form()._schema,
                submissionOData
              ],
              tableSelector: `#form-submissions-table${i}`
            }));
      }
    });

    describe('download', () => {
      it('download button shows number of submissions', () =>
        loadSubmissions(2)
          .afterResponses(page => {
            const button = page.first('#form-submissions-download-button');
            const text = button.text().trim().replace(/\s+/g, ' ');
            const count = testData.extendedSubmissions.size;
            text.should.equal(`Download all ${count} records`);
          }));

      it('clicking download button downloads a .zip file', () => {
        let clicked = false;
        let href;
        let download;
        const zipContents = 'zip contents';
        return loadSubmissions(1)
          .complete()
          .request(page => {
            $(page.element).find('a[download]').first().click((event) => {
              clicked = true;
              const $a = $(event.currentTarget);
              href = $a.attr('href');
              download = $a.attr('download');
            });
            trigger.click(page.first('#form-submissions-download-button'));
          })
          .respondWithData(() => new Blob([zipContents]))
          .afterResponse(page => {
            clicked.should.be.true();
            href.should.startWith('blob:');
            href.should.equal(page.data().downloadHref);
            download.should.equal(`${form().xmlFormId}.zip`);
          })
          .then(() => axios.get(href))
          .then(response => response.data.should.equal(zipContents));
      });
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
            component.find('#form-submissions-download-button').should.be.empty();
          }));

      it('does not show the analyze button', () =>
        loadSubmissions(0)
          .afterResponses(component => {
            component.find('#form-submissions-analyze-button').should.be.empty();
          }));
    });
  });
});

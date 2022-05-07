import { DateTime, Settings } from 'luxon';

import sinon from 'sinon';

import DateRangePicker from '../../../src/components/date-range-picker.vue';
import SubmissionFilters from '../../../src/components/submission/filters.vue';
import SubmissionMetadataRow from '../../../src/components/submission/metadata-row.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { loadSubmissionList } from '../../util/submission';
import { mergeMountOptions } from '../../util/lifecycle';
import { mockLogin } from '../../util/session';
import { relativeUrl } from '../../util/request';
import { setLuxon } from '../../util/date-time';
import { testRouter } from '../../util/router';

const loadComponent = (...args) => {
  const [queryString, mountOptions] = typeof args[0] === 'string'
    ? args
    : ['', args[0]];
  return loadSubmissionList(mergeMountOptions(mountOptions, {
    container: { router: testRouter() }
  }))
    .route(`/projects/1/forms/f/submissions?${queryString}`);
};

describe('SubmissionFilters', () => {
  beforeEach(mockLogin);

  let restoreLuxon;
  beforeEach(() => {
    restoreLuxon = setLuxon({ defaultZoneName: 'UTC' });
  });
  afterEach(() => {
    restoreLuxon();
  });

  describe('initial filters', () => {
    beforeEach(() => {
      testData.extendedForms.createPast(1);
    });

    it('filters on submitter if ?submitter is specified', () =>
      loadComponent('submitterId=1')
        .beforeEachResponse((_, { url }) => {
          if (url.includes('.svc')) {
            const filter = relativeUrl(url).searchParams.get('$filter');
            filter.should.equal('__system/submitterId eq 1');
          }
        })
        .afterResponses(component => {
          const filters = component.getComponent(SubmissionFilters).props();
          filters.submitterId.should.equal('1');
        }));

    it('filters on review state if ?reviewState is specified', () =>
      loadComponent('reviewState=%27approved%27&reviewState=null')
        .beforeEachResponse((_, { url }) => {
          if (url.includes('.svc')) {
            const filter = relativeUrl(url).searchParams.get('$filter');
            // For now, we only use the first ?reviewState query parameter.
            filter.should.equal("(__system/reviewState eq 'approved')");
          }
        })
        .afterResponses(component => {
          const filters = component.getComponent(SubmissionFilters).props();
          filters.reviewState.should.eql(["'approved'"]);
        }));

    it('filters on submission date if ?start and ?end are specified', () =>
      loadComponent('start=1970-01-01&end=1970-01-02')
        .beforeEachResponse((_, { url }) => {
          if (url.includes('.svc')) {
            const filter = relativeUrl(url).searchParams.get('$filter');
            filter.should.equal('__system/submissionDate ge 1970-01-01T00:00:00.000Z and __system/submissionDate le 1970-01-02T23:59:59.999Z');
          }
        })
        .afterResponses(component => {
          const filters = component.getComponent(SubmissionFilters).props();
          const [start, end] = filters.submissionDate;
          start.toISO().should.equal('1970-01-01T00:00:00.000Z');
          end.toISO().should.equal('1970-01-02T00:00:00.000Z');
        }));

    it('ignores any times specified in ?start and ?end', () =>
      loadComponent('start=1970-01-01T12:00:00Z&end=1970-01-02T12:00:00Z')
        .afterResponses(component => {
          const filters = component.getComponent(SubmissionFilters).props();
          const [start, end] = filters.submissionDate;
          start.toISO().should.equal('1970-01-01T00:00:00.000Z');
          end.toISO().should.equal('1970-01-02T00:00:00.000Z');
        }));

    describe('empty or invalid query parameters', () => {
      const cases = [
        '',
        'submitterId=-1',
        'submitterId=foo',
        'submitterId',
        'submitterId=1&submitterId=1',
        'reviewState=foo',
        'reviewState',
        'start=1970-01-01',
        'end=1970-01-01',
        'start=1970-01-01&end=foo',
        'start=1970-01-01&end',
        'start=foo&end=1970-01-01',
        'start&end=1970-01-01',
        'start=1970-01-02&end=1970-01-01',
        'start=1970-01-01&end=1970-01-02&start=1970-01-01',
        'start=1970-01-01&end=1970-01-02&end=1970-01-02'
      ];
      for (const queryString of cases) {
        it(`does not filter if the query string is ?${queryString}`, () =>
          loadComponent(queryString)
            .beforeEachResponse((_, { url }) => {
              if (url.includes('.svc'))
                relativeUrl(url).searchParams.has('$filter').should.be.false();
            })
            .afterResponses(component => {
              const filters = component.getComponent(SubmissionFilters).props();
              filters.submitterId.should.equal('');
              filters.submissionDate.should.eql([]);
              filters.reviewState.should.eql([]);
            }));
      }
    });
  });

  describe('after the submitter filter is changed', () => {
    beforeEach(() => {
      testData.extendedProjects.createPast(1, { forms: 1, appUsers: 1 });
      testData.extendedFieldKeys.createPast(1);
    });

    it('sends a request', () => {
      const fieldKey = testData.extendedFieldKeys.last();
      testData.extendedSubmissions.createPast(1, { submitter: fieldKey });
      return loadComponent()
        .complete()
        .request(component => {
          const select = component.get('#submission-filters-submitter select');
          return select.setValue(fieldKey.id.toString());
        })
        .beforeEachResponse((_, { url }) => {
          const filter = relativeUrl(url).searchParams.get('$filter');
          filter.should.equal(`__system/submitterId eq ${fieldKey.id}`);
        })
        .respondWithData(testData.submissionOData);
    });

    it('updates the URL', () => {
      const fieldKey = testData.extendedFieldKeys.last();
      testData.extendedSubmissions.createPast(1, { submitter: fieldKey });
      return loadComponent()
        .complete()
        .request(component => {
          const select = component.get('#submission-filters-submitter select');
          return select.setValue(fieldKey.id.toString());
        })
        .respondWithData(testData.submissionOData)
        .afterResponse(component => {
          const { submitterId } = component.vm.$route.query;
          submitterId.should.equal(fieldKey.id.toString());
        });
    });

    it('re-renders the table', () => {
      testData.extendedForms.createPast(1, { submissions: 3 });
      const fieldKey = testData.extendedFieldKeys.last();
      testData.extendedSubmissions.createPast(3, { submitter: fieldKey });
      return loadComponent({
        props: { top: () => 2 }
      })
        .complete()
        .request(component => {
          sinon.replace(component.vm, 'scrolledToBottom', () => true);
          document.dispatchEvent(new Event('scroll'));
        })
        .respondWithData(() => testData.submissionOData(2, 2))
        .afterResponse(component => {
          component.findAllComponents(SubmissionMetadataRow).length.should.equal(3);
        })
        .request(component => {
          const select = component.get('#submission-filters-submitter select');
          return select.setValue(fieldKey.id.toString());
        })
        .beforeEachResponse(component => {
          component.findComponent(SubmissionMetadataRow).exists().should.be.false();
        })
        .respondWithData(() => testData.submissionOData(2, 0))
        .afterResponse(component => {
          component.findAllComponents(SubmissionMetadataRow).length.should.equal(2);
        });
    });
  });

  describe('after the submission date filter is changed', () => {
    beforeEach(() => {
      testData.extendedForms.createPast(1);
    });

    it('sends a request', () =>
      loadComponent()
        .complete()
        .request(component => {
          component.getComponent(DateRangePicker).vm.close([
            DateTime.fromISO('1970-01-01').toJSDate(),
            DateTime.fromISO('1970-01-02').toJSDate()
          ]);
        })
        .beforeEachResponse((_, { url }) => {
          const match = url.match(/&%24filter=__system%2FsubmissionDate\+ge\+([^+]+)\+and\+__system%2FsubmissionDate\+le\+([^+]+)(&|$)/);
          should.exist(match);

          const start = decodeURIComponent(match[1]);
          start.should.equal('1970-01-01T00:00:00.000Z');
          DateTime.fromISO(start).zoneName.should.equal(Settings.defaultZoneName);

          const end = decodeURIComponent(match[2]);
          end.should.equal('1970-01-02T23:59:59.999Z');
          DateTime.fromISO(end).zoneName.should.equal(Settings.defaultZoneName);
        })
        .respondWithData(testData.submissionOData));

    it('updates the URL', () =>
      loadComponent()
        .complete()
        .request(component => {
          component.getComponent(DateRangePicker).vm.close([
            DateTime.fromISO('1970-01-01').toJSDate(),
            DateTime.fromISO('1970-01-02').toJSDate()
          ]);
        })
        .respondWithData(testData.submissionOData)
        .afterResponse(component => {
          const { start, end } = component.vm.$route.query;
          start.should.equal('1970-01-01');
          end.should.equal('1970-01-02');
        }));
  });

  describe('after the review state filter is changed', () => {
    beforeEach(() => {
      testData.extendedForms.createPast(1);
    });

    it('sends a request', () =>
      loadComponent()
        .complete()
        .request(component => {
          const select = component.get('#submission-filters-review-state select');
          return select.setValue("'approved'");
        })
        .beforeEachResponse((_, { url }) => {
          const filter = relativeUrl(url).searchParams.get('$filter');
          filter.should.equal("(__system/reviewState eq 'approved')");
        })
        .respondWithData(testData.submissionOData));

    it('updates the URL', () =>
      loadComponent()
        .complete()
        .request(component => {
          const select = component.get('#submission-filters-review-state select');
          return select.setValue("'approved'");
        })
        .respondWithData(testData.submissionOData)
        .afterResponse(component => {
          component.vm.$route.query.reviewState.should.eql(["'approved'"]);
        }));
  });

  it.skip('allows multiple review states to be selected', () => {
    testData.extendedForms.createPast(1);
    return loadComponent()
      .complete()
      .request(component => {
        const select = component.get('#submission-filters-review-state select');
        const options = select.findAll('option');
        options[0].element.selected = true;
        options[1].element.selected = true;
        return select.trigger('change');
      })
      .beforeEachResponse((_, { url }) => {
        url.should.match(/&%24filter=%28__system%2FreviewState\+eq\+null\+or\+__system%2FreviewState\+eq\+%27approved%27%29(&|$)/);
      })
      .respondWithData(testData.submissionOData);
  });

  it('specifies the filters together', () => {
    testData.extendedProjects.createPast(1, { forms: 1, appUsers: 1 });
    const fieldKey = testData.extendedFieldKeys.createPast(1).last();
    testData.extendedSubmissions.createPast(1, { submitter: fieldKey });
    return loadComponent()
      .complete()
      .request(component => {
        const select = component.get('#submission-filters-submitter select');
        return select.setValue(fieldKey.id.toString());
      })
      .respondWithData(testData.submissionOData)
      .complete()
      .request(component => {
        component.getComponent(DateRangePicker).vm.close([
          DateTime.fromISO('1970-01-01').toJSDate(),
          DateTime.fromISO('1970-01-02').toJSDate()
        ]);
      })
      .respondWithData(() => testData.submissionOData(0))
      .complete()
      .request(component => {
        const select = component.get('#submission-filters-review-state select');
        return select.setValue('null');
      })
      .beforeEachResponse((_, { url }) => {
        const filter = relativeUrl(url).searchParams.get('$filter');
        filter.should.match(/^__system\/submitterId eq \d+ and __system\/submissionDate ge \S+ and __system\/submissionDate le \S+ and \(__system\/reviewState eq null\)$/);
      })
      .respondWithData(() => testData.submissionOData(0))
      .afterResponse(component => {
        component.vm.$route.query.should.eql({
          submitterId: fieldKey.id.toString(),
          start: '1970-01-01',
          end: '1970-01-02',
          reviewState: ['null']
        });
      });
  });

  it('numbers the rows based on the number of filtered submissions', () => {
    testData.extendedProjects.createPast(1, { forms: 1, appUsers: 2 });
    testData.extendedForms.createPast(1, { submissions: 2 });
    testData.extendedSubmissions.createPast(1, {
      submitter: testData.extendedFieldKeys.createPast(1).last()
    });
    testData.extendedSubmissions.createPast(1, {
      submitter: testData.extendedFieldKeys.createPast(1).last()
    });
    return loadComponent()
      .complete()
      .request(component => {
        const select = component.get('#submission-filters-submitter select');
        return select.setValue(testData.extendedFieldKeys.last().id.toString());
      })
      .respondWithData(() => ({
        value: [testData.extendedSubmissions.last()._odata],
        '@odata.count': 1
      }))
      .afterResponse(component => {
        component.getComponent(SubmissionMetadataRow).props().rowNumber.should.equal(1);
      });
  });

  it('does not update form.submissions', () => {
    testData.extendedProjects.createPast(1, { forms: 1, appUsers: 2 });
    testData.extendedForms.createPast(1, { submissions: 2 });
    testData.extendedSubmissions.createPast(1, {
      submitter: testData.extendedFieldKeys.createPast(1).last()
    });
    testData.extendedSubmissions.createPast(1, {
      submitter: testData.extendedFieldKeys.createPast(1).last()
    });
    return load('/projects/1/forms/f/submissions')
      .afterResponses(app => {
        app.vm.$store.state.request.data.form.submissions.should.equal(2);
      })
      .request(app => {
        const select = app.get('#submission-filters-submitter select');
        return select.setValue(testData.extendedFieldKeys.last().id.toString());
      })
      .respondWithData(() => ({
        value: [testData.extendedSubmissions.last()._odata],
        '@odata.count': 1
      }))
      .afterResponse(app => {
        app.vm.$store.state.request.data.form.submissions.should.equal(2);
      });
  });

  describe('loading message', () => {
    it('shows the correct message for the first chunk', () => {
      testData.extendedProjects.createPast(1, { forms: 1, appUsers: 1 });
      testData.extendedForms.createPast(1, { submissions: 3 });
      const fieldKey = testData.extendedFieldKeys.createPast(1).last();
      testData.extendedSubmissions.createPast(3, { submitter: fieldKey });
      return loadComponent({
        props: { top: () => 2 }
      })
        .complete()
        .request(component => {
          const select = component.get('#submission-filters-submitter select');
          return select.setValue(fieldKey.id.toString());
        })
        .beforeEachResponse(component => {
          const text = component.get('#submission-list-message-text').text();
          text.trim().should.equal('Loading matching Submissions…');
        })
        .respondWithData(() => testData.submissionOData(2, 0));
    });

    it('shows the correct message for the second chunk', () => {
      testData.extendedProjects.createPast(1, { forms: 1, appUsers: 1 });
      testData.extendedForms.createPast(1, { submissions: 5 });
      const fieldKey = testData.extendedFieldKeys.createPast(1).last();
      testData.extendedSubmissions.createPast(5, { submitter: fieldKey });
      return loadComponent({
        props: { top: () => 2 }
      })
        .complete()
        .request(component => {
          const select = component.get('#submission-filters-submitter select');
          return select.setValue(fieldKey.id.toString());
        })
        .respondWithData(() => testData.submissionOData(2, 0))
        .complete()
        .request(component => {
          sinon.replace(component.vm, 'scrolledToBottom', () => true);
          document.dispatchEvent(new Event('scroll'));
        })
        .beforeEachResponse(component => {
          const text = component.get('#submission-list-message-text').text();
          text.trim().should.equal('Loading 2 more of 3 remaining matching Submissions…');
        })
        .respondWithData(() => testData.submissionOData(2, 2));
    });

    describe('last chunk', () => {
      it('shows correct message if there is one submission remaining', () => {
        testData.extendedProjects.createPast(1, { forms: 1, appUsers: 1 });
        testData.extendedForms.createPast(1, { submissions: 3 });
        const fieldKey = testData.extendedFieldKeys.createPast(1).last();
        testData.extendedSubmissions.createPast(3, { submitter: fieldKey });
        return loadComponent({
          props: { top: () => 2 }
        })
          .complete()
          .request(component => {
            const select = component.get('#submission-filters-submitter select');
            return select.setValue(fieldKey.id.toString());
          })
          .respondWithData(() => testData.submissionOData(2, 0))
          .complete()
          .request(component => {
            sinon.replace(component.vm, 'scrolledToBottom', () => true);
            document.dispatchEvent(new Event('scroll'));
          })
          .beforeEachResponse(component => {
            const text = component.get('#submission-list-message-text').text();
            text.trim().should.equal('Loading the last matching Submission…');
          })
          .respondWithData(() => testData.submissionOData(2, 2));
      });

      it('shows correct message if there is are multiple submissions remaining', () => {
        testData.extendedProjects.createPast(1, { forms: 1, appUsers: 1 });
        testData.extendedForms.createPast(1, { submissions: 4 });
        const fieldKey = testData.extendedFieldKeys.createPast(1).last();
        testData.extendedSubmissions.createPast(4, { submitter: fieldKey });
        return loadComponent({
          props: { top: () => 2 }
        })
          .complete()
          .request(component => {
            const select = component.get('#submission-filters-submitter select');
            return select.setValue(fieldKey.id.toString());
          })
          .respondWithData(() => testData.submissionOData(2, 0))
          .complete()
          .request(component => {
            sinon.replace(component.vm, 'scrolledToBottom', () => true);
            document.dispatchEvent(new Event('scroll'));
          })
          .beforeEachResponse(component => {
            const text = component.get('#submission-list-message-text').text();
            text.trim().should.equal('Loading the last 2 matching Submissions…');
          })
          .respondWithData(() => testData.submissionOData(2, 2));
      });
    });
  });
});

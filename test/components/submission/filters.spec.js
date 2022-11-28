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
const createFieldKeys = (count) => new Array(count).fill(undefined)
  .map((_, i) => testData.extendedFieldKeys
    .createPast(1, { displayName: `App User ${i}` })
    .last());
const changeMultiselect = (selector, selectedIndexes) => async (component) => {
  const multiselect = component.get(selector);
  const toggle = multiselect.get('select');
  await toggle.trigger('click');
  await multiselect.get('.select-none').trigger('click');
  const inputs = multiselect.findAll('input[type="checkbox"]');
  for (const i of selectedIndexes)
    await inputs[i].setValue(true); // eslint-disable-line no-await-in-loop
  return toggle.trigger('click');
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
      loadComponent('submitterId=1&submitterId=2')
        .beforeEachResponse((_, { url }) => {
          if (url.includes('.svc')) {
            const filter = relativeUrl(url).searchParams.get('$filter');
            filter.should.equal('(__system/submitterId eq 1 or __system/submitterId eq 2)');
          }
        })
        .afterResponses(component => {
          const filters = component.getComponent(SubmissionFilters).props();
          filters.submitterId.should.eql([1, 2]);
        }));

    it('filters on review state if ?reviewState is specified', () =>
      loadComponent('reviewState=%27approved%27&reviewState=null')
        .beforeEachResponse((_, { url }) => {
          if (url.includes('.svc')) {
            const filter = relativeUrl(url).searchParams.get('$filter');
            filter.should.equal("(__system/reviewState eq 'approved' or __system/reviewState eq null)");
          }
        })
        .afterResponses(component => {
          const filters = component.getComponent(SubmissionFilters).props();
          filters.reviewState.should.eql(["'approved'", 'null']);
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
              filters.submitterId.should.eql([]);
              filters.submissionDate.should.eql([]);
              filters.reviewState.length.should.equal(5);
            }));
      }
    });
  });

  describe('after the submitter filter is changed', () => {
    beforeEach(() => {
      testData.extendedProjects.createPast(1, { forms: 1, appUsers: 3 });
      testData.extendedForms.createPast(1, { submissions: 3 });
      const fieldKeys = createFieldKeys(3);
      testData.extendedSubmissions
        .createPast(1, { submitter: fieldKeys[2] })
        .createPast(1, { submitter: fieldKeys[1] })
        .createPast(1, { submitter: fieldKeys[0] });
    });

    it('sends a request', () =>
      loadComponent({ attachTo: document.body })
        .complete()
        .request(changeMultiselect('#submission-filters-submitter', [0]))
        .beforeEachResponse((_, { url }) => {
          const filter = relativeUrl(url).searchParams.get('$filter');
          const { id } = testData.extendedFieldKeys.first();
          filter.should.equal(`(__system/submitterId eq ${id})`);
        })
        .respondWithData(() => ({
          ...testData.submissionOData(1),
          '@odata.count': 1
        })));

    it('updates the URL', () =>
      loadComponent({ attachTo: document.body })
        .complete()
        .request(changeMultiselect('#submission-filters-submitter', [0]))
        .respondWithData(() => ({
          ...testData.submissionOData(1),
          '@odata.count': 1
        }))
        .afterResponse(component => {
          const { submitterId } = component.vm.$route.query;
          const { id } = testData.extendedFieldKeys.first();
          submitterId.should.eql([id.toString()]);
        }));

    it('re-renders the table', () =>
      loadComponent({ props: { top: () => 2 }, attachTo: document.body })
        .complete()
        .request(component => {
          sinon.replace(component.vm, 'scrolledToBottom', () => true);
          document.dispatchEvent(new Event('scroll'));
        })
        .respondWithData(() => testData.submissionOData(2, 2))
        .afterResponse(component => {
          component.findAllComponents(SubmissionMetadataRow).length.should.equal(3);
        })
        .request(changeMultiselect('#submission-filters-submitter', [0]))
        .beforeEachResponse(component => {
          component.findComponent(SubmissionMetadataRow).exists().should.be.false();
        })
        .respondWithData(() => ({
          ...testData.submissionOData(1),
          '@odata.count': 1
        }))
        .afterResponse(component => {
          component.findAllComponents(SubmissionMetadataRow).length.should.equal(1);
        }));

    it('allows multiple submitters to be selected', () =>
      loadComponent({ attachTo: document.body })
        .complete()
        .request(changeMultiselect('#submission-filters-submitter', [0, 1]))
        .beforeEachResponse((_, { url }) => {
          const filter = relativeUrl(url).searchParams.get('$filter');
          const id0 = testData.extendedFieldKeys.get(0).id;
          const id1 = testData.extendedFieldKeys.get(1).id;
          filter.should.equal(`(__system/submitterId eq ${id0} or __system/submitterId eq ${id1})`);
        })
        .respondWithData(() => ({
          ...testData.submissionOData(2),
          '@odata.count': 2
        })));
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
      loadComponent({ attachTo: document.body })
        .complete()
        .request(changeMultiselect('#submission-filters-review-state', [1]))
        .beforeEachResponse((_, { url }) => {
          const filter = relativeUrl(url).searchParams.get('$filter');
          filter.should.equal("(__system/reviewState eq 'hasIssues')");
        })
        .respondWithData(testData.submissionOData));

    it('updates the URL', () =>
      loadComponent({ attachTo: document.body })
        .complete()
        .request(changeMultiselect('#submission-filters-review-state', [1]))
        .respondWithData(testData.submissionOData)
        .afterResponse(component => {
          component.vm.$route.query.reviewState.should.eql(["'hasIssues'"]);
        }));

    it('allows multiple review states to be selected', () =>
      loadComponent({ attachTo: document.body })
        .complete()
        .request(changeMultiselect('#submission-filters-review-state', [0, 1]))
        .beforeEachResponse((_, { url }) => {
          const filter = relativeUrl(url).searchParams.get('$filter');
          filter.should.equal("(__system/reviewState eq null or __system/reviewState eq 'hasIssues')");
        })
        .respondWithData(testData.submissionOData));
  });

  it('specifies the filters together', () => {
    testData.extendedProjects.createPast(1, { forms: 1, appUsers: 2 });
    const fieldKeys = createFieldKeys(2);
    testData.extendedSubmissions
      .createPast(1, { submitter: fieldKeys[1] })
      .createPast(1, { submitter: fieldKeys[0] });
    return loadComponent({ attachTo: document.body })
      .complete()
      .request(changeMultiselect('#submission-filters-submitter', [0]))
      .respondWithData(() => ({
        ...testData.submissionOData(1),
        '@odata.count': 1
      }))
      .complete()
      .request(component => {
        component.getComponent(DateRangePicker).vm.close([
          DateTime.fromISO('1970-01-01').toJSDate(),
          DateTime.fromISO('1970-01-02').toJSDate()
        ]);
      })
      .respondWithData(() => ({ value: [], '@odata.count': 0 }))
      .complete()
      .request(changeMultiselect('#submission-filters-review-state', [0]))
      .beforeEachResponse((_, { url }) => {
        const filter = relativeUrl(url).searchParams.get('$filter');
        filter.should.match(/^\(__system\/submitterId eq \d+\) and __system\/submissionDate ge \S+ and __system\/submissionDate le \S+ and \(__system\/reviewState eq null\)$/);
      })
      .respondWithData(() => ({ value: [], '@odata.count': 0 }))
      .afterResponse(component => {
        component.vm.$route.query.should.eql({
          submitterId: [fieldKeys[0].id.toString()],
          start: '1970-01-01',
          end: '1970-01-02',
          reviewState: ['null']
        });
      });
  });

  it('numbers the rows based on the number of filtered submissions', () => {
    testData.extendedProjects.createPast(1, { forms: 1, appUsers: 1 });
    testData.extendedForms.createPast(1, { submissions: 2 });
    const submitter = testData.extendedFieldKeys.createPast(1).last();
    testData.extendedSubmissions
      .createPast(1, { reviewState: 'approved', submitter })
      .createPast(1, { reviewState: null, submitter });
    return loadComponent({ attachTo: document.body })
      .complete()
      .request(changeMultiselect('#submission-filters-review-state', [0]))
      .respondWithData(() => ({
        ...testData.submissionOData(1),
        '@odata.count': 1
      }))
      .afterResponse(component => {
        component.getComponent(SubmissionMetadataRow).props().rowNumber.should.equal(1);
      });
  });

  it('does not update form.submissions', () => {
    testData.extendedProjects.createPast(1, { forms: 1, appUsers: 1 });
    testData.extendedForms.createPast(1, { submissions: 2 });
    const submitter = testData.extendedFieldKeys.createPast(1).last();
    testData.extendedSubmissions
      .createPast(1, { reviewState: 'approved', submitter })
      .createPast(1, { reviewState: null, submitter });
    return load('/projects/1/forms/f/submissions', { attachTo: document.body })
      .afterResponses(app => {
        app.vm.$container.requestData.form.submissions.should.equal(2);
      })
      .request(changeMultiselect('#submission-filters-review-state', [0]))
      .respondWithData(() => ({
        ...testData.submissionOData(1),
        '@odata.count': 1
      }))
      .afterResponse(app => {
        app.vm.$container.requestData.form.submissions.should.equal(2);
      });
  });

  describe('loading message', () => {
    const createData = (submissionCount) => {
      testData.extendedProjects.createPast(1, { forms: 1, appUsers: 1 });
      testData.extendedForms.createPast(1, { submissions: submissionCount });
      const fieldKey = testData.extendedFieldKeys.createPast(1).last();
      testData.extendedSubmissions.createPast(submissionCount, {
        reviewState: null,
        submitter: fieldKey
      });
    };

    it('shows the correct message for the first chunk', () => {
      createData(3);
      return loadComponent({ props: { top: () => 2 }, attachTo: document.body })
        .complete()
        .request(changeMultiselect('#submission-filters-review-state', [0]))
        .beforeEachResponse(component => {
          const text = component.get('#submission-list-message-text').text();
          text.trim().should.equal('Loading matching Submissions…');
        })
        .respondWithData(() => testData.submissionOData(2, 0));
    });

    it('shows the correct message for the second chunk', () => {
      createData(5);
      return loadComponent({ props: { top: () => 2 }, attachTo: document.body })
        .complete()
        .request(changeMultiselect('#submission-filters-review-state', [0]))
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
        createData(3);
        return loadComponent({ props: { top: () => 2 }, attachTo: document.body })
          .complete()
          .request(changeMultiselect('#submission-filters-review-state', [0]))
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
        createData(4);
        return loadComponent({ props: { top: () => 2 }, attachTo: document.body })
          .complete()
          .request(changeMultiselect('#submission-filters-review-state', [0]))
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

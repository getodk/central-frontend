import { DateTime, Settings } from 'luxon';

import DateRangePicker from '../../../src/components/date-range-picker.vue';
import SubmissionFilters from '../../../src/components/submission/filters.vue';
import SubmissionMetadataRow from '../../../src/components/submission/metadata-row.vue';

import testData from '../../data';
import { changeMultiselect } from '../../util/trigger';
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

describe('SubmissionFilters', () => {
  beforeEach(mockLogin);

  beforeEach(() => {
    setLuxon({ defaultZoneName: 'UTC' });
  });

  it('selects all submitters by default', () => {
    testData.extendedProjects.createPast(1, { forms: 1, appUsers: 1 });
    const fieldKey = testData.extendedFieldKeys.createPast(1).last();
    testData.extendedSubmissions.createPast(1, { submitter: fieldKey });
    return loadComponent()
      .beforeEachResponse((component, { url }) => {
        if (url.includes('/submitters')) {
          const filters = component.getComponent(SubmissionFilters).props();
          // filters.submitterId is initialized as [], but it is changed after
          // the response from .../submitters.
          filters.submitterId.should.eql([]);
        }
      })
      .afterResponses(component => {
        const filters = component.getComponent(SubmissionFilters).props();
        filters.submitterId.should.eql([fieldKey.id]);
      });
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
            filter.should.match(/__system\/submitterId eq 1 or __system\/submitterId eq 2/);
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
            filter.should.match(/__system\/reviewState eq 'approved' or __system\/reviewState eq null/);
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
            filter.should.match(/__system\/submissionDate ge 1970-01-01T00:00:00.000Z and __system\/submissionDate le 1970-01-02T23:59:59.999Z/);
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
              // we have default filters for submissionDate and deletedAt
              if (url.includes('.svc'))
                relativeUrl(url).searchParams.get('$filter').split(' and ').length.should.be.eql(2);
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
          filter.should.include(`(__system/submitterId eq ${id})`);
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

    it('re-renders the table', () => {
      testData.extendedSubmissions.createPast(250);
      return loadComponent({ attachTo: document.body })
        .complete()
        .request(component => {
          component.get('button[aria-label="Next page"]').trigger('click');
        })
        .respondWithData(() => testData.submissionOData(250, 250))
        .afterResponse(component => {
          component.findAllComponents(SubmissionMetadataRow).length.should.equal(3);
        })
        .request(changeMultiselect('#submission-filters-submitter', [0]))
        .beforeEachResponse((component, { url }) => {
          component.findComponent(SubmissionMetadataRow).exists().should.be.false;
          relativeUrl(url).searchParams.get('$skip').should.be.eql('0');
        })
        .respondWithData(() => ({
          ...testData.submissionOData(1),
          '@odata.count': 1
        }))
        .afterResponse(component => {
          component.findAllComponents(SubmissionMetadataRow).length.should.equal(1);
        });
    });

    it('allows multiple submitters to be selected', () =>
      loadComponent({ attachTo: document.body })
        .complete()
        .request(changeMultiselect('#submission-filters-submitter', [0, 1]))
        .beforeEachResponse((_, { url }) => {
          const filter = relativeUrl(url).searchParams.get('$filter');
          const id0 = testData.extendedFieldKeys.get(0).id;
          const id1 = testData.extendedFieldKeys.get(1).id;
          filter.should.include(`(__system/submitterId eq ${id0} or __system/submitterId eq ${id1})`);
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
          const filters = new URL(url, window.location.origin).searchParams.get('$filter').split(' and ');

          const start = filters[2].split(' ge ')[1];
          start.should.equal('1970-01-01T00:00:00.000Z');
          DateTime.fromISO(start).zoneName.should.equal(Settings.defaultZoneName);

          const end = filters[3].split(' le ')[1];
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
          filter.should.include("(__system/reviewState eq 'hasIssues')");
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
          filter.should.match(/__system\/reviewState eq null or __system\/reviewState eq 'hasIssues'/);
        })
        .respondWithData(testData.submissionOData));
  });

  it('specifies the default filters', () => {
    testData.extendedProjects.createPast(1, { forms: 1, appUsers: 2 });
    const fieldKeys = createFieldKeys(2);
    testData.extendedSubmissions
      .createPast(1, { submitter: fieldKeys[1] })
      .createPast(1, { submitter: fieldKeys[0] });
    return loadComponent({ attachTo: document.body })
      .beforeEachResponse((_, { url }) => {
        if (url.includes('.svc')) {
          const filter = relativeUrl(url).searchParams.get('$filter');
          filter.should.match(/^__system\/submissionDate le \S+ and \(__system\/deletedAt eq null or __system\/deletedAt gt \S+\)$/);
        }
      })
      .complete();
  });

  it('specifies the default filters for deleted', () => {
    testData.extendedProjects.createPast(1, { forms: 1, appUsers: 2 });
    const fieldKeys = createFieldKeys(2);
    testData.extendedSubmissions
      .createPast(1, { submitter: fieldKeys[1] })
      .createPast(1, { submitter: fieldKeys[0] });
    return loadComponent({ attachTo: document.body, props: { deleted: true } })
      .beforeEachResponse((_, { url }) => {
        if (url.includes('.svc')) {
          const filter = relativeUrl(url).searchParams.get('$filter');
          filter.should.match(/^__system\/deletedAt le \S+$/);
        }
      })
      .complete();
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
        filter.should.match(/\(__system\/submitterId eq \d+\) and __system\/submissionDate ge \S+ and __system\/submissionDate le \S+ and \(__system\/reviewState eq null\)/);
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

  it('does not update form.submissions after filtering', () => {
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

  it('disables all filters', () => {
    testData.extendedProjects.createPast(1, { forms: 1, appUsers: 1 });
    const fieldKey = testData.extendedFieldKeys.createPast(1).last();
    testData.extendedSubmissions.createPast(1, { submitter: fieldKey });
    return loadComponent({ props: { deleted: true } })
      .afterResponses(component => {
        component.getComponent(DateRangePicker).props().disabled.should.be.true;
        const multiselects = component.findAll('.multiselect select');
        multiselects[0].attributes('aria-disabled').should.equal('true');
        multiselects[1].attributes('aria-disabled').should.equal('true');
      });
  });

  // https://github.com/getodk/central/issues/756
  it('does not send an extra OData request after filtering, then navigating away', () => {
    testData.extendedForms.createPast(1);
    testData.extendedFormVersions.createPast(1, { draft: true });
    let odataRequests = 0;
    return load('/projects/1/forms/f/submissions?reviewState=%27approved%27')
      .complete()
      .route('/projects/1/forms/f/draft')
      .respondForComponent('FormEdit')
      .beforeEachResponse((_, { url }) => {
        if (url.includes('.svc')) odataRequests += 1;
      })
      .afterResponses(() => {
        odataRequests.should.equal(1);
      });
  });

  describe('reset button', () => {
    beforeEach(() => {
      testData.extendedForms.createPast(1);
    });

    it('resets the filters when clicked', () =>
      loadComponent('submitterId=1&submitterId=2&reviewState=null')
        .complete()
        .request(component => {
          component.get('.btn-reset').trigger('click');
        })
        .respondWithData(testData.submissionOData)
        .afterResponses(component => {
          should.not.exist(component.vm.$route.query.submitterId);
        }));
  });
});

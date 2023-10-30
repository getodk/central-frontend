import { DateTime, Settings } from 'luxon';

import AuditFiltersAction from '../../../src/components/audit/filters/action.vue';
import DateRangePicker from '../../../src/components/date-range-picker.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';
import { relativeUrl } from '../../util/request';
import { setLuxon } from '../../util/date-time';

describe('AuditFilters', () => {
  beforeEach(mockLogin);

  describe('action filter', () => {
    it('uses the action query parameter for the initial request', () =>
      load('/system/audits?action=user.create')
        .beforeEachResponse((_, { url }) => {
          const action = relativeUrl(url).searchParams.get('action');
          action.should.equal('user.create');
        }));

    it('passes the query parameter to the filter component', async () => {
      const app = await load('/system/audits?action=user.create');
      const { modelValue } = app.getComponent(AuditFiltersAction).props();
      modelValue.should.equal('user.create');
    });

    it('defaults to nonverbose', () =>
      load('/system/audits')
        .beforeEachResponse((_, { url }) => {
          const action = relativeUrl(url).searchParams.get('action');
          action.should.equal('nonverbose');
        }));

    it('filters by category', () =>
      load('/system/audits?action=user')
        .beforeEachResponse((_, { url }) => {
          const action = relativeUrl(url).searchParams.get('action');
          action.should.equal('user');
        }));

    describe('invalid query parameters', () => {
      const cases = [
        // The value of the query parameter is an unknown category.
        'action=USER',
        // Unknown action
        'action=user.CREATE',
        // The value of the query parameter is an array.
        'action=user.create&action=user.delete',
        // The value of the query parameter is `null`.
        'action'
      ];
      for (const query of cases) {
        it(`falls back to the default for ?${query}`, () =>
          load(`/system/audits?${query}`)
            .beforeEachResponse((_, { url }) => {
              const action = relativeUrl(url).searchParams.get('action');
              action.should.equal('nonverbose');
            }));
      }
    });

    describe('after the filter selection is changed', () => {
      it('sends a request', () =>
        load('/system/audits')
          .complete()
          .request(app =>
            app.get('#audit-filters-action select').setValue('user.create'))
          .beforeEachResponse((_, { url }) => {
            const action = relativeUrl(url).searchParams.get('action');
            action.should.equal('user.create');
          })
          .respondWithData(() => testData.extendedAudits.sorted()));

      it('updates the query parameter', () =>
        load('/system/audits')
          .complete()
          .request(app =>
            app.get('#audit-filters-action select').setValue('user.create'))
          .respondWithData(() => testData.extendedAudits.sorted())
          .afterResponse(app => {
            app.vm.$route.query.action.should.equal('user.create');
          }));

      it('removes the query parameter if nonverbose is selected', () =>
        load('/system/audits?action=user.create')
          .complete()
          .request(app =>
            app.get('#audit-filters-action select').setValue('nonverbose'))
          .respondWithData(() => testData.extendedAudits.sorted())
          .afterResponse(app => {
            should.not.exist(app.vm.$route.query.action);
          }));
    });

    describe('after the query parameter is changed', () => {
      it('sends a request', () =>
        load('/system/audits')
          .complete()
          .route('/system/audits?action=user.create')
          .beforeEachResponse((_, { url }) => {
            const action = relativeUrl(url).searchParams.get('action');
            action.should.equal('user.create');
          })
          .respondWithData(() => testData.extendedAudits.sorted()));

      it('updates the filter component', () =>
        load('/system/audits')
          .complete()
          .route('/system/audits?action=user.create')
          .respondWithData(() => testData.extendedAudits.sorted())
          .afterResponse(app => {
            const { modelValue } = app.getComponent(AuditFiltersAction).props();
            modelValue.should.equal('user.create');
          }));
    });
  });

  describe('date range filter', () => {
    beforeEach(() => {
      // Not specifying a time zone, because flatpickr will use the system time
      // zone even if we specify a different time zone for Luxon.
      setLuxon({ now: '2023-02-01T12:00:00' });
    });

    it('uses the query parameters for the initial request', () =>
      load('/system/audits?start=2023-01-01&end=2023-01-31')
        .beforeEachResponse((_, { url }) => {
          const params = relativeUrl(url).searchParams;

          const start = params.get('start');
          start.should.startWith('2023-01-01T00:00:00.000');
          DateTime.fromISO(start).zoneName.should.equal(Settings.defaultZoneName);

          const end = params.get('end');
          end.should.startWith('2023-01-31T23:59:59.999');
          DateTime.fromISO(end).zoneName.should.equal(Settings.defaultZoneName);
        }));

    it('passes the date range to the filter component', () =>
      load('/system/audits?start=2023-01-01&end=2023-01-31')
        .beforeEachResponse(app => {
          const { modelValue } = app.getComponent(DateRangePicker).props();
          modelValue[0].toISO().should.startWith('2023-01-01T00:00:00.000');
          modelValue[1].toISO().should.startWith('2023-01-31T00:00:00.000');
        }));

    it('defaults to the current date', () =>
      load('/system/audits')
        .beforeEachResponse((_, { url }) => {
          const params = relativeUrl(url).searchParams;
          params.get('start').should.startWith('2023-02-01T00:00:00.000');
          params.get('end').should.startWith('2023-02-01T23:59:59.999');
        }));

    describe('invalid query parameters', () => {
      const cases = [
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
      for (const query of cases) {
        it(`falls back to the default for ?${query}`, () =>
          load(`/system/audits?${query}`)
            .beforeEachResponse((_, { url }) => {
              const params = relativeUrl(url).searchParams;
              params.get('start').should.startWith('2023-02-01T00:00:00.000');
              params.get('end').should.startWith('2023-02-01T23:59:59.999');
            }));
      }
    });

    describe('after the filter selection is changed', () => {
      const change = (start, end) => (app) => {
        const dates = [start, end].map(iso => DateTime.fromISO(iso).toJSDate());
        app.getComponent(DateRangePicker).vm.close(dates);
      };

      it('sends a request', () =>
        load('/system/audits')
          .complete()
          .request(change('2023-01-01', '2023-01-31'))
          .beforeEachResponse((_, { url }) => {
            const params = relativeUrl(url).searchParams;
            params.get('start').should.startWith('2023-01-01T00:00:00.000');
            params.get('end').should.startWith('2023-01-31T23:59:59.999');
          })
          .respondWithData(() => testData.extendedAudits.sorted()));

      it('updates the query parameters', () =>
        load('/system/audits')
          .complete()
          .request(change('2023-01-01', '2023-01-31'))
          .respondWithData(() => testData.extendedAudits.sorted())
          .afterResponse(app => {
            app.vm.$route.query.should.eql({
              start: '2023-01-01',
              end: '2023-01-31'
            });
          }));

      it('removes the query parameters if the default is selected', () =>
        load('/system/audits?start=2023-01-01&end=2023-01-31')
          .complete()
          .request(change('2023-02-01', '2023-02-01'))
          .respondWithData(() => testData.extendedAudits.sorted())
          .afterResponse(app => {
            app.vm.$route.query.should.eql({});
          }));
    });

    describe('after a query parameter is changed', () => {
      it('sends a request', () =>
        load('/system/audits')
          .complete()
          .route('/system/audits?start=2023-01-01&end=2023-01-31')
          .beforeEachResponse((_, { url }) => {
            const params = relativeUrl(url).searchParams;
            params.get('start').should.startWith('2023-01-01T00:00:00.000');
            params.get('end').should.startWith('2023-01-31T23:59:59.999');
          })
          .respondWithData(() => testData.extendedAudits.sorted()));

      it('updates the filter component', () =>
        load('/system/audits')
          .complete()
          .route('/system/audits?start=2023-01-01&end=2023-01-31')
          .respondWithData(() => testData.extendedAudits.sorted())
          .afterResponse(app => {
            const { modelValue } = app.getComponent(DateRangePicker).props();
            modelValue[0].toISO().should.startWith('2023-01-01T00:00:00.000');
            modelValue[1].toISO().should.startWith('2023-01-31T00:00:00.000');
          }));
    });
  });
});

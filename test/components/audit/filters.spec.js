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

  it('initially specifies nonverbose for action', () =>
    load('/system/audits', { root: false })
      .beforeEachResponse((component, { url }) => {
        url.should.containEql('action=nonverbose');
        const { modelValue } = component.getComponent(AuditFiltersAction).props();
        modelValue.should.equal('nonverbose');
      }));

  it('sends a request after the action filter is changed', () =>
    load('/system/audits', { root: false })
      .complete()
      .request(component =>
        component.get('#audit-filters-action select').setValue('project.create'))
      .beforeEachResponse((_, { url }) => {
        url.should.containEql('action=project.create');
      })
      .respondWithData(() => testData.extendedAudits.sorted()));

  it('initially specifies the current date for start and end', () => {
    // Not specifying a time zone, because flatpickr will use the system time
    // zone even if we specify a different time zone for Luxon.
    const restoreLuxon = setLuxon({ now: '1970-01-01T12:00:00' });
    return load('/system/audits', { root: false })
      .beforeEachResponse((component, { url }) => {
        const params = relativeUrl(url).searchParams;

        const start = params.get('start');
        start.should.startWith('1970-01-01T00:00:00.000');
        DateTime.fromISO(start).zoneName.should.equal(Settings.defaultZoneName);

        const end = params.get('end');
        end.should.startWith('1970-01-01T23:59:59.999');
        DateTime.fromISO(end).zoneName.should.equal(Settings.defaultZoneName);

        const { modelValue } = component.getComponent(DateRangePicker).props();
        modelValue[0].toISO().should.equal(start);
        modelValue[1].toISO().should.equal(start);
      })
      .finally(restoreLuxon);
  });

  it('sends a request after the date range is changed', () =>
    load('/system/audits', { root: false })
      .complete()
      .request(component => {
        const start = DateTime.fromISO('1970-01-02').toJSDate();
        const end = DateTime.fromISO('1970-01-03').toJSDate();
        component.getComponent(DateRangePicker).vm.close([start, end]);
      })
      .beforeEachResponse((component, { url }) => {
        url.should.containEql('start=1970-01-02T00%3A00%3A00.000');
        url.should.containEql('end=1970-01-03T23%3A59%3A59.999');
      })
      .respondWithData(() => testData.extendedAudits.sorted()));
});

import { DateTime } from 'luxon';

import AuditFilters from '../../../src/components/audit/filters.vue';
import AuditList from '../../../src/components/audit/list.vue';
import testData from '../../data';
import { mockHttp } from '../../http';
import { mockLogin } from '../../session';
import { setLuxon } from '../../util/util';
import { trigger } from '../../event';

describe('AuditFilters', () => {
  beforeEach(mockLogin);

  it('shows a message if no audit log entries are returned', () =>
    mockHttp()
      .mount(AuditList)
      .respondWithData(() => testData.extendedAudits.sorted())
      .afterResponse(component => {
        component.find('.empty-table-message').length.should.equal(1);
      }));

  it('initially specifies nonverbose for action', () =>
    mockHttp()
      .mount(AuditList)
      .beforeEachResponse((component, config) => {
        config.url.should.containEql('action=nonverbose');
      })
      .respondWithData(() => testData.extendedAudits.sorted()));

  it('sends a request after the action filter is changed', () =>
    mockHttp()
      .mount(AuditList)
      .respondWithData(() => testData.extendedAudits.sorted())
      .complete()
      .request(component => trigger.changeValue(
        component,
        '#audit-filters select',
        'project.create'
      ))
      .beforeEachResponse((component, config) => {
        config.url.should.containEql('action=project.create');
      })
      .respondWithData(() => testData.extendedAudits.sorted()));

  it('initially specifies the current date for start and end', () => {
    const restoreLuxon = setLuxon({
      defaultZoneName: 'UTC+1',
      now: '1970-01-01T12:00:00Z'
    });
    return mockHttp()
      .mount(AuditList)
      .beforeEachResponse((component, config) => {
        config.url.should.containEql('start=1970-01-01T00%3A00%3A00.000%2B01%3A00');
        config.url.should.containEql('end=1970-01-01T23%3A59%3A59.999%2B01%3A00');
      })
      .respondWithData(() => testData.extendedAudits.sorted())
      .finally(restoreLuxon);
  });

  it('sends a request after a range of multiple dates is selected', () => {
    const restoreLuxon = setLuxon({ defaultZoneName: 'UTC' });
    return mockHttp()
      .mount(AuditList)
      .respondWithData(() => testData.extendedAudits.sorted())
      .complete()
      .request(component => {
        const start = DateTime.fromISO('1970-01-02').toJSDate();
        const end = DateTime.fromISO('1970-01-03').toJSDate();
        // Ideally, we would actually open the flatPickr calendar and select the
        // dates, but writing that test turned out to be fairly challenging.
        component.first(AuditFilters).vm.closeCalendar([start, end]);
      })
      .beforeEachResponse((component, config) => {
        config.url.should.containEql('start=1970-01-02T00%3A00%3A00.000Z');
        config.url.should.containEql('end=1970-01-03T23%3A59%3A59.999Z');
      })
      .respondWithData(() => testData.extendedAudits.sorted())
      .finally(restoreLuxon);
  });

  it('sends a request after a single date is selected', () => {
    const restoreLuxon = setLuxon({ defaultZoneName: 'UTC' });
    return mockHttp()
      .mount(AuditList)
      .respondWithData(() => testData.extendedAudits.sorted())
      .complete()
      .request(component => {
        const date = DateTime.fromISO('1970-01-02').toJSDate();
        component.first(AuditFilters).vm.closeCalendar([date, date]);
      })
      .beforeEachResponse((component, config) => {
        config.url.should.containEql('start=1970-01-02T00%3A00%3A00.000Z');
        config.url.should.containEql('end=1970-01-02T23%3A59%3A59.999Z');
      })
      .respondWithData(() => testData.extendedAudits.sorted())
      .finally(restoreLuxon);
  });

  // The date range can be cleared if, for example, the user presses backspace
  // after opening the flatPickr calendar. There doesn't seem to be an easy way
  // to turn that behavior off, so here we test that Frontend reacts reasonably
  // in that case.
  it('sends a request without start and end if the date range is cleared', () =>
    mockHttp()
      .mount(AuditList)
      .respondWithData(() => testData.extendedAudits.sorted())
      .complete()
      .request(component => {
        component.first(AuditFilters).vm.closeCalendar([]);
      })
      .beforeEachResponse((component, config) => {
        config.url.should.not.containEql('start');
        config.url.should.not.containEql('end');
      })
      .respondWithData(() => testData.extendedAudits.sorted()));
});

import { DateTime } from 'luxon';

import AuditFilters from '../../../src/components/audit/filters.vue';
import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';
import { setLuxon } from '../../util/date-time';
import { trigger } from '../../util/event';

describe('AuditFilters', () => {
  beforeEach(mockLogin);

  it('renders the action filter correctly', () =>
    load('/system/audits', { component: true }, {}).then(component => {
      const options = component.find('#audit-filters option');
      // Test one category option and one action option.
      options[0].text().trim().should.equal('(All Actions)');
      options[0].hasClass('action-category').should.be.true();
      options[2].text().trim().should.equal('Create');
      options[2].hasClass('action-category').should.be.false();
    }));

  it('initially specifies nonverbose for action', () =>
    load('/system/audits', { component: true }, {})
      .beforeEachResponse((component, config) => {
        config.url.should.containEql('action=nonverbose');
      }));

  it('sends a request after the action filter is changed', () =>
    load('/system/audits', { component: true }, {})
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
      now: '1970-01-01T12:00:00+01:00'
    });
    return load('/system/audits', { component: true }, {})
      .beforeEachResponse((component, config) => {
        config.url.should.containEql('start=1970-01-01T00%3A00%3A00.000%2B01%3A00');
        config.url.should.containEql('end=1970-01-01T23%3A59%3A59.999%2B01%3A00');

        const input = component.first('.flatpickr-input');
        input.element.value.should.equal('1970/01/01');
      })
      .finally(restoreLuxon);
  });

  it('sends a request after a range of multiple dates is selected', () => {
    const restoreLuxon = setLuxon({ defaultZoneName: 'utc' });
    return load('/system/audits', { component: true }, {})
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
    const restoreLuxon = setLuxon({
      defaultZoneName: 'utc',
      now: '1970-01-01T00:00:00Z'
    });
    return load('/system/audits', { component: true }, {})
      .complete()
      .request(component => {
        const date = DateTime.fromISO('1970-01-02').toJSDate();
        component.first(AuditFilters).vm.closeCalendar([date, date]);
      })
      .beforeEachResponse((component, { url }) => {
        url.should.containEql('start=1970-01-02T00%3A00%3A00.000Z');
        url.should.containEql('end=1970-01-02T23%3A59%3A59.999Z');
      })
      .respondWithData(() => testData.extendedAudits.sorted())
      .finally(restoreLuxon);
  });

  it('sends a request after an incomplete selection of a single date', () => {
    const restoreLuxon = setLuxon({
      defaultZoneName: 'utc',
      now: '1970-01-01T00:00:00Z'
    });
    return load('/system/audits', { component: true, attachToDocument: true }, {})
      .complete()
      .request(component => {
        const date = DateTime.fromISO('1970-01-02').toJSDate();
        component.first(AuditFilters).vm.closeCalendar([date]);
      })
      .beforeEachResponse((component, { url }) => {
        url.should.containEql('start=1970-01-02T00%3A00%3A00.000Z');
        url.should.containEql('end=1970-01-02T23%3A59%3A59.999Z');

        const input = component.first('.flatpickr-input');
        input.element.value.should.equal('1970/01/02');
      })
      .respondWithData(() => testData.extendedAudits.sorted())
      .finally(restoreLuxon);
  });

  it('sends a request for current date if date range is cleared', () => {
    const restoreLuxon = setLuxon({
      defaultZoneName: 'utc',
      now: '1970-01-01T12:00:00Z'
    });
    return load('/system/audits', { component: true, attachToDocument: true }, {})
      .complete()
      .request(component => {
        // Test what happens if a day passes between when the page is loaded and
        // the calendar is closed.
        setLuxon({ now: '1970-01-02T12:00:00Z' });
        component.first(AuditFilters).vm.closeCalendar([]);
      })
      .beforeEachResponse((component, { url }) => {
        url.should.containEql('start=1970-01-02T00%3A00%3A00.000Z');
        url.should.containEql('end=1970-01-02T23%3A59%3A59.999Z');

        const input = component.first('.flatpickr-input');
        input.element.value.should.equal('1970/01/02');
      })
      .respondWithData(() => testData.extendedAudits.sorted())
      .finally(restoreLuxon);
  });

  it('does not send a request if the same date range is selected', () => {
    const restoreLuxon = setLuxon({
      defaultZoneName: 'utc',
      now: '1970-01-01T12:00:00Z'
    });
    let called = false;
    return load('/system/audits', { component: true }, {})
      .complete()
      // Select the same date range.
      .testNoRequest(component => {
        const date = DateTime.fromISO('1970-01-01').toJSDate();
        component.first(AuditFilters).vm.closeCalendar([date, date]);
      })
      // Clear the date range (defaulting to the same date range).
      .testNoRequest(component => {
        const auditFilters = component.first(AuditFilters);
        const { dateRangeToString } = auditFilters.vm;
        auditFilters.setMethods({
          dateRangeToString: (dateRange) => {
            called = true;
            return dateRangeToString(dateRange);
          }
        });
        return auditFilters.vm.$nextTick().then(() => {
          auditFilters.vm.closeCalendar([]);
        });
      })
      .then(() => {
        // The date range has not changed, but the dateRangeString property
        // still should have been reset.
        called.should.be.true();
      })
      .finally(restoreLuxon);
  });
});

import { DateTime } from 'luxon';

import DateRangePicker from '../../src/components/date-range-picker.vue';
import TestUtilVModel from '../util/components/v-model.vue';
import { loadLocale } from '../../src/util/i18n';
import { mount } from '../util/lifecycle';
import { setLuxon } from '../util/date-time';
import { wait } from '../util/util';

const mountComponent = ({
  value = ['1970-01-01', '1970-01-01'],
  placeholder = 'Date range',
  parent = false
} = {}) => {
  const dateTimes = value.map(DateTime.fromISO);
  if (parent) {
    const component = mount(TestUtilVModel, {
      propsData: {
        component: DateRangePicker,
        props: { placeholder },
        value: dateTimes
      }
    });
    return component.first(DateRangePicker);
  }
  return mount(DateRangePicker, {
    propsData: { value: dateTimes, placeholder }
  });
};
const toISO = (dateTime) => dateTime.toISO({
  suppressMilliseconds: true,
  suppressSeconds: true,
  includeOffset: false
});
const close = (component, selectedDatesAsISO) => {
  const asDates = selectedDatesAsISO.map(iso => DateTime.fromISO(iso).toJSDate());
  component.vm.close(asDates);
  // Using wait() rather than nextTick(), because flatpickrValue will change
  // twice in quick succession.
  return wait();
};

describe('DateRangePicker', () => {
  let restoreLuxon;
  before(() => {
    // Not specifying a time zone, because flatpickr will use the system time
    // zone even if we specify a different time zone for Luxon.
    restoreLuxon = setLuxon({ now: DateTime.fromISO('1970-01-01') });
  });
  after(() => {
    restoreLuxon();
  });

  it('initializes flatpickrValue according to value', () => {
    const component = mountComponent({ value: ['1970-01-02', '1970-01-03'] });
    const { flatpickrValue } = component.data();
    const iso = flatpickrValue.map(DateTime.fromJSDate).map(toISO);
    iso.should.eql(['1970-01-02T00:00', '1970-01-03T00:00']);
    const input = component.first('.flatpickr-input');
    input.element.value.should.equal('1970/01/02 to 1970/01/03');
  });

  it('initializes flatpickrValue correctly for a range of a single date', () => {
    const component = mountComponent({ value: ['1970-01-02', '1970-01-02'] });
    const { flatpickrValue } = component.data();
    const iso = flatpickrValue.map(DateTime.fromJSDate).map(toISO);
    iso.should.eql(['1970-01-02T00:00', '1970-01-02T00:00']);
    const input = component.first('.flatpickr-input');
    input.element.value.should.equal('1970/01/02');
  });

  it('changes flatpickrValue after value changes', () => {
    const component = mountComponent({ value: ['1970-01-02', '1970-01-03'] });
    component.setProps({
      value: ['1970-01-04', '1970-01-05'].map(DateTime.fromISO)
    });
    return component.vm.$nextTick().then(() => {
      const { flatpickrValue } = component.data();
      flatpickrValue.should.equal('1970/01/04 to 1970/01/05');
      const input = component.first('.flatpickr-input');
      input.element.value.should.equal('1970/01/04 to 1970/01/05');
    });
  });

  it('changes flatpickrValue correctly after value changes to range of single date', () => {
    const component = mountComponent({ value: ['1970-01-02', '1970-01-03'] });
    component.setProps({
      value: ['1970-01-04', '1970-01-04'].map(DateTime.fromISO)
    });
    return component.vm.$nextTick().then(() => {
      const { flatpickrValue } = component.data();
      flatpickrValue.should.equal('1970/01/04');
      const input = component.first('.flatpickr-input');
      input.element.value.should.equal('1970/01/04');
    });
  });

  it('changes value after a different range is selected', () => {
    const component = mountComponent({
      value: ['1970-01-02', '1970-01-03'],
      parent: true
    });
    // Ideally, we would actually open the flatpickr calendar and select the
    // dates, but writing that test turned out to be fairly challenging.
    return close(component, ['1970-01-04', '1970-01-05']).then(() => {
      const iso = component.getProp('value').map(toISO);
      iso.should.eql(['1970-01-04T00:00', '1970-01-05T00:00']);
    });
  });

  it('changes value correctly after a range of a single date is selected', () => {
    const component = mountComponent({
      value: ['1970-01-02', '1970-01-03'],
      parent: true
    });
    return close(component, ['1970-01-04', '1970-01-04']).then(() => {
      const iso = component.getProp('value').map(toISO);
      iso.should.eql(['1970-01-04T00:00', '1970-01-04T00:00']);
    });
  });

  it('does not change value if the same range is selected', () => {
    const component = mountComponent({
      value: ['1970-01-02', '1970-01-03'],
      parent: true
    });
    let changeCount = 0;
    component.vm.$watch('value', () => {
      changeCount += 1;
    });
    return close(component, ['1970-01-04', '1970-01-05'])
      .then(() => {
        changeCount.should.equal(1);
      })
      .then(() => close(component, ['1970-01-04', '1970-01-05']))
      .then(() => {
        changeCount.should.equal(1);
      });
  });

  describe('incomplete selection of a single date', () => {
    it('changes value correctly', () => {
      const component = mountComponent({
        value: ['1970-01-02', '1970-01-03'],
        parent: true
      });
      return close(component, ['1970-01-04']).then(() => {
        const iso = component.getProp('value').map(toISO);
        iso.should.eql(['1970-01-04T00:00', '1970-01-04T00:00']);
      });
    });

    it('changes flatpickrValue even if value does not change', () => {
      const component = mountComponent({
        value: ['1970-01-02', '1970-01-02'],
        parent: true
      });
      let changeCount = 0;
      component.vm.$watch('flatpickrValue', () => {
        changeCount += 1;
      });
      return close(component, ['1970-01-02']).then(() => {
        const { flatpickrValue } = component.data();
        flatpickrValue.should.equal('1970/01/02');
        changeCount.should.equal(2);
      });
    });
  });

  describe('clearing the selection', () => {
    it('changes value to the current date', () => {
      const component = mountComponent({
        value: ['1970-01-02', '1970-01-03'],
        parent: true
      });
      return close(component, []).then(() => {
        const iso = component.getProp('value').map(toISO);
        iso.should.eql(['1970-01-01T00:00', '1970-01-01T00:00']);
      });
    });

    it('changes flatpickrValue even if value does not change', () => {
      const component = mountComponent({
        value: ['1970-01-01', '1970-01-01'],
        parent: true
      });
      let changeCount = 0;
      component.vm.$watch('flatpickrValue', () => {
        changeCount += 1;
      });
      return close(component, []).then(() => {
        const { flatpickrValue } = component.data();
        flatpickrValue.should.equal('1970/01/01');
        changeCount.should.equal(2);
      });
    });
  });

  it('shows a placeholder', () => {
    const component = mountComponent({ placeholder: 'My date range' });
    const input = component.first('.flatpickr-input');
    input.getAttribute('placeholder').should.equal('My date range');
    input.getAttribute('aria-label').should.equal('My date range');
  });

  describe('i18n', () => {
    it('does not specify a flatpickr locale if the i18n locale is en', () => {
      should.not.exist(mountComponent().vm.config.locale);
    });

    it('specifies a flatpickr locale if the i18n locale is es', () =>
      loadLocale('es')
        .then(() => {
          const { locale } = mountComponent().vm.config;
          locale.weekdays.longhand[0].should.equal('Domingo');
        })
        .finally(() => loadLocale('en')));
  });
});

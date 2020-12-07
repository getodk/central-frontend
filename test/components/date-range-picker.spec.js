import sinon from 'sinon';
import { DateTime } from 'luxon';

import DateRangePicker from '../../src/components/date-range-picker.vue';

import { loadLocale } from '../../src/util/i18n';
import { mount } from '../util/lifecycle';
import { setLuxon } from '../util/date-time';
import { trigger } from '../util/event';
import { wait } from '../util/util';

const fromISO = DateTime.fromISO.bind(DateTime);
const toISO = (value) => {
  const dateTime = value instanceof Date ? DateTime.fromJSDate(value) : value;
  return dateTime.toISO({
    suppressMilliseconds: true,
    suppressSeconds: true,
    includeOffset: false
  });
};
const mountComponent = (options = {}) => {
  const propsData = options.propsData != null ? options.propsData : {};
  const value = propsData.value != null
    ? propsData.value
    : ['1970-01-01', '1970-01-01'];
  return mount(DateRangePicker, {
    ...options,
    propsData: {
      ...propsData,
      value: value.map(fromISO),
      placeholder: propsData.placeholder != null
        ? propsData.placeholder
        : 'Date range'
    }
  });
};
const close = (component, selectedDatesAsISO) => {
  const asDates = selectedDatesAsISO.map(iso => DateTime.fromISO(iso).toJSDate());
  component.vm.close(asDates);
};

describe('DateRangePicker', () => {
  let restoreLuxon;
  before(() => {
    // Not specifying a time zone, because flatpickr will use the system time
    // zone even if we specify a different time zone for Luxon.
    restoreLuxon = setLuxon({ now: fromISO('1970-01-01') });
  });
  after(() => {
    restoreLuxon();
  });

  describe('initial value of flatpickrValue', () => {
    it('initializes flatpickrValue according to value', () => {
      const component = mountComponent({
        propsData: { value: ['1970-01-02', '1970-01-03'] }
      });
      component.data().flatpickrValue.map(toISO).should.eql([
        '1970-01-02T00:00',
        '1970-01-03T00:00'
      ]);
      const input = component.first('input');
      input.element.value.should.equal('1970/01/02 to 1970/01/03');
    });

    it('initializes flatpickrValue correctly for a range of a single date', () => {
      const component = mountComponent({
        propsData: { value: ['1970-01-02', '1970-01-02'] }
      });
      component.data().flatpickrValue.map(toISO).should.eql([
        '1970-01-02T00:00',
        '1970-01-02T00:00'
      ]);
      component.first('input').element.value.should.equal('1970/01/02');
    });

    it('initializes flatpickrValue correctly if value is empty', () => {
      const component = mountComponent({
        propsData: { value: [] }
      });
      component.data().flatpickrValue.length.should.equal(0);
      component.first('input').element.value.should.equal('');
    });
  });

  describe('value of flatpickrValue after the value prop changes', () => {
    it('changes flatpickrValue after value changes', async () => {
      const component = mountComponent({
        propsData: { value: ['1970-01-02', '1970-01-03'] }
      });
      component.setProps({ value: ['1970-01-04', '1970-01-05'].map(fromISO) });
      await component.vm.$nextTick();
      component.data().flatpickrValue.should.equal('1970/01/04 to 1970/01/05');
      const input = component.first('input');
      input.element.value.should.equal('1970/01/04 to 1970/01/05');
    });

    it('changes flatpickrValue after value changes to range of single date', async () => {
      const component = mountComponent({
        propsData: { value: ['1970-01-02', '1970-01-03'] }
      });
      component.setProps({ value: ['1970-01-04', '1970-01-04'].map(fromISO) });
      await component.vm.$nextTick();
      component.data().flatpickrValue.should.equal('1970/01/04');
      component.first('input').element.value.should.equal('1970/01/04');
    });

    it('changes flatpickrValue after value changes to empty array', async () => {
      const component = mountComponent({
        propsData: { value: ['1970-01-02', '1970-01-03'] }
      });
      component.setProps({ value: [] });
      await component.vm.$nextTick();
      component.data().flatpickrValue.should.equal('');
      component.first('input').element.value.should.equal('');
    });
  });

  it('emits an input event after a different range is selected', () => {
    const component = mountComponent({
      propsData: { value: ['1970-01-02', '1970-01-03'] }
    });
    const $emit = sinon.fake();
    sinon.replace(component.vm, '$emit', $emit);
    // Ideally, we would actually open the flatpickr calendar and select the
    // dates, but writing that test turned out to be fairly challenging.
    close(component, ['1970-01-04', '1970-01-05']);
    const { args } = $emit.getCall(0);
    args[0].should.equal('input');
    args[1].map(toISO).should.eql(['1970-01-04T00:00', '1970-01-05T00:00']);
  });

  it('emits correct value after a range of a single date is selected', () => {
    const component = mountComponent({
      propsData: { value: ['1970-01-02', '1970-01-03'] }
    });
    const $emit = sinon.fake();
    sinon.replace(component.vm, '$emit', $emit);
    close(component, ['1970-01-04', '1970-01-04']);
    $emit.getCall(0).args[1].map(toISO).should.eql([
      '1970-01-04T00:00',
      '1970-01-04T00:00'
    ]);
  });

  it('does not emit an input event if the same range is selected', () => {
    const component = mountComponent({
      propsData: { value: ['1970-01-02', '1970-01-03'] }
    });
    const $emit = sinon.fake();
    sinon.replace(component.vm, '$emit', $emit);
    close(component, ['1970-01-02', '1970-01-03']);
    $emit.called.should.be.false();
  });

  describe('incomplete selection of a single date', () => {
    it('emits the correct value', () => {
      const component = mountComponent({
        propsData: { value: ['1970-01-02', '1970-01-03'] }
      });
      const $emit = sinon.fake();
      sinon.replace(component.vm, '$emit', $emit);
      close(component, ['1970-01-04']);
      $emit.getCall(0).args[1].map(toISO).should.eql([
        '1970-01-04T00:00',
        '1970-01-04T00:00'
      ]);
    });

    it('changes flatpickrValue even if value does not change', async () => {
      const component = mountComponent({
        propsData: { value: ['1970-01-02', '1970-01-02'] }
      });
      const $emit = sinon.fake();
      sinon.replace(component.vm, '$emit', $emit);
      let changeCount = 0;
      component.vm.$watch('flatpickrValue', () => { changeCount += 1; });
      close(component, ['1970-01-02']);
      await wait();
      $emit.called.should.be.false();
      component.data().flatpickrValue.should.equal('1970/01/02');
      changeCount.should.equal(2);
    });
  });

  // This has to do with clearing the selection using normal flatpickr behavior
  // (for example, pressing backspace), not with clearing it using the .close
  // button.
  describe('clearing the selection', () => {
    it('emits an empty array if the required prop is false', () => {
      const component = mountComponent({
        propsData: { value: ['1970-01-02', '1970-01-03'], required: false }
      });
      const $emit = sinon.fake();
      sinon.replace(component.vm, '$emit', $emit);
      close(component, []);
      $emit.getCall(0).args[1].length.should.equal(0);
    });

    describe('required prop is true', () => {
      it('emits the current date', () => {
        const component = mountComponent({
          propsData: { value: ['1970-01-02', '1970-01-03'], required: true }
        });
        const $emit = sinon.fake();
        sinon.replace(component.vm, '$emit', $emit);
        close(component, []);
        $emit.getCall(0).args[1].map(toISO).should.eql([
          '1970-01-01T00:00',
          '1970-01-01T00:00'
        ]);
      });

      it('changes flatpickrValue even if value does not change', async () => {
        const component = mountComponent({
          propsData: { value: ['1970-01-01', '1970-01-01'], required: true }
        });
        const $emit = sinon.fake();
        sinon.replace(component.vm, '$emit', $emit);
        let changeCount = 0;
        component.vm.$watch('flatpickrValue', () => { changeCount += 1; });
        close(component, []);
        await wait();
        $emit.called.should.be.false();
        component.data().flatpickrValue.should.equal('1970/01/01');
        changeCount.should.equal(2);
      });
    });
  });

  describe('.close button', () => {
    it('does not render the button if the required prop is true', () => {
      const component = mountComponent({
        propsData: { value: ['1970-01-02', '1970-01-03'], required: true }
      });
      component.find('.close').length.should.equal(0);
    });

    it('hides the button if value is an empty array', () => {
      const component = mountComponent({
        propsData: { value: [], required: false }
      });
      component.first('.close').should.be.hidden();
    });

    it('shows the button otherwise', () => {
      const component = mountComponent({
        propsData: { value: ['1970-01-02', '1970-01-03'], required: false }
      });
      component.first('.close').should.be.visible();
    });

    describe('after the button is clicked', () => {
      it('emits an empty array', () => {
        const component = mountComponent({
          propsData: { value: ['1970-01-02', '1970-01-03'], required: false }
        });
        const $emit = sinon.fake();
        sinon.replace(component.vm, '$emit', $emit);
        trigger.click(component, '.close');
        $emit.getCall(0).args[1].length.should.equal(0);
      });

      it('focuses the input', async () => {
        const component = mountComponent({
          propsData: { value: ['1970-01-02', '1970-01-03'], required: false },
          attachToDocument: true
        });
        await trigger.click(component, '.close');
        component.first('input').should.be.focused();
      });
    });
  });

  describe('placeholder prop', () => {
    it('uses the placeholder prop', () => {
      const component = mountComponent({
        propsData: { placeholder: 'My date range', required: false }
      });
      const placeholder = component.first('input').getAttribute('placeholder');
      placeholder.should.equal('My date range');
      const label = component.first('.form-label').text().trim();
      label.should.equal('My date range');
    });

    it('appends * to the placeholder if the required prop is true', () => {
      const component = mountComponent({
        propsData: { placeholder: 'My date range', required: true }
      });
      const placeholder = component.first('input').getAttribute('placeholder');
      placeholder.should.equal('My date range*');
      const label = component.first('.form-label').text().trim();
      label.should.equal('My date range*');
    });
  });

  it('adds the required class if the required prop is true', () => {
    const component = mountComponent({
      propsData: { required: true }
    });
    component.first('input').hasClass('required').should.be.true();
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

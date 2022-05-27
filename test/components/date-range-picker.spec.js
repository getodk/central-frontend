import { DateTime } from 'luxon';

import DateRangePicker from '../../src/components/date-range-picker.vue';

import { loadLocale } from '../../src/util/i18n';

import createTestContainer from '../util/container';
import { mergeMountOptions, mount } from '../util/lifecycle';
import { setLuxon } from '../util/date-time';
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
const mountComponent = (options) => {
  const merged = mergeMountOptions(options, {
    props: {
      modelValue: ['1970-01-01', '1970-01-01'],
      placeholder: 'Date range'
    }
  });
  merged.props.modelValue = merged.props.modelValue.map(fromISO);
  return mount(DateRangePicker, merged);
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
    it('initializes flatpickrValue according to the modelValue prop', () => {
      const component = mountComponent({
        props: { modelValue: ['1970-01-02', '1970-01-03'] }
      });
      component.vm.flatpickrValue.map(toISO).should.eql([
        '1970-01-02T00:00',
        '1970-01-03T00:00'
      ]);
      const input = component.get('input');
      input.element.value.should.equal('1970/01/02 to 1970/01/03');
    });

    it('initializes flatpickrValue correctly for a range of a single date', () => {
      const component = mountComponent({
        props: { modelValue: ['1970-01-02', '1970-01-02'] }
      });
      component.vm.flatpickrValue.map(toISO).should.eql([
        '1970-01-02T00:00',
        '1970-01-02T00:00'
      ]);
      component.get('input').element.value.should.equal('1970/01/02');
    });

    it('initializes flatpickrValue correctly if modelValue is empty', () => {
      const component = mountComponent({
        props: { modelValue: [] }
      });
      component.vm.flatpickrValue.length.should.equal(0);
      component.get('input').element.value.should.equal('');
    });
  });

  describe('value of flatpickrValue after the modelValue prop changes', () => {
    it('changes flatpickrValue after modelValue changes', async () => {
      const component = mountComponent({
        props: { modelValue: ['1970-01-02', '1970-01-03'] }
      });
      await component.setProps({ modelValue: ['1970-01-04', '1970-01-05'].map(fromISO) });
      component.vm.flatpickrValue.map(toISO).should.eql([
        '1970-01-04T00:00',
        '1970-01-05T00:00'
      ]);
      const input = component.get('input');
      input.element.value.should.equal('1970/01/04 to 1970/01/05');
    });

    it('changes flatpickrValue after modelValue changes to range of single date', async () => {
      const component = mountComponent({
        props: { modelValue: ['1970-01-02', '1970-01-03'] }
      });
      await component.setProps({ modelValue: ['1970-01-04', '1970-01-04'].map(fromISO) });
      component.vm.flatpickrValue.map(toISO).should.eql([
        '1970-01-04T00:00',
        '1970-01-04T00:00'
      ]);
      component.get('input').element.value.should.equal('1970/01/04');
    });

    it('changes flatpickrValue after modelValue changes to empty array', async () => {
      const component = mountComponent({
        props: { modelValue: ['1970-01-02', '1970-01-03'] }
      });
      await component.setProps({ modelValue: [] });
      component.vm.flatpickrValue.should.eql([]);
      component.get('input').element.value.should.equal('');
    });
  });

  it('emits an update:modelValue event after a different range is selected', () => {
    const component = mountComponent({
      props: { modelValue: ['1970-01-02', '1970-01-03'] }
    });
    // Ideally, we would actually open the flatpickr calendar and select the
    // dates, but writing that test turned out to be fairly challenging.
    close(component, ['1970-01-04', '1970-01-05']);
    component.emitted('update:modelValue')[0][0].map(toISO).should.eql([
      '1970-01-04T00:00',
      '1970-01-05T00:00'
    ]);
  });

  it('emits correct value after a range of a single date is selected', () => {
    const component = mountComponent({
      props: { modelValue: ['1970-01-02', '1970-01-03'] }
    });
    close(component, ['1970-01-04', '1970-01-04']);
    component.emitted('update:modelValue')[0][0].map(toISO).should.eql([
      '1970-01-04T00:00',
      '1970-01-04T00:00'
    ]);
  });

  it('does not emit an update:modelValue event if same range is selected', () => {
    const component = mountComponent({
      props: { modelValue: ['1970-01-02', '1970-01-03'] }
    });
    close(component, ['1970-01-02', '1970-01-03']);
    should.not.exist(component.emitted('update:modelValue'));
  });

  describe('incomplete selection of a single date', () => {
    it('emits the correct value', () => {
      const component = mountComponent({
        props: { modelValue: ['1970-01-02', '1970-01-03'] }
      });
      close(component, ['1970-01-04']);
      component.emitted('update:modelValue')[0][0].map(toISO).should.eql([
        '1970-01-04T00:00',
        '1970-01-04T00:00'
      ]);
    });

    it('changes flatpickrValue even if modelValue prop does not change', async () => {
      const component = mountComponent({
        props: { modelValue: ['1970-01-02', '1970-01-02'] }
      });
      let changeCount = 0;
      component.vm.$watch('flatpickrValue', () => { changeCount += 1; });
      close(component, ['1970-01-02']);
      await wait();
      should.not.exist(component.emitted('update:modelValue'));
      component.vm.flatpickrValue.should.equal('1970/01/02');
      changeCount.should.equal(2);
    });
  });

  // This has to do with clearing the selection using normal flatpickr behavior
  // (for example, pressing backspace), not with clearing it using the .close
  // button.
  describe('clearing the selection', () => {
    it('emits an empty array if the required prop is false', () => {
      const component = mountComponent({
        props: { modelValue: ['1970-01-02', '1970-01-03'], required: false }
      });
      close(component, []);
      component.emitted('update:modelValue')[0][0].should.eql([]);
    });

    describe('required prop is true', () => {
      it('emits the current date', () => {
        const component = mountComponent({
          props: { modelValue: ['1970-01-02', '1970-01-03'], required: true }
        });
        close(component, []);
        component.emitted('update:modelValue')[0][0].map(toISO).should.eql([
          '1970-01-01T00:00',
          '1970-01-01T00:00'
        ]);
      });

      it('changes flatpickrValue even if modelValue prop does not change', async () => {
        const component = mountComponent({
          props: { modelValue: ['1970-01-01', '1970-01-01'], required: true }
        });
        let changeCount = 0;
        component.vm.$watch('flatpickrValue', () => { changeCount += 1; });
        close(component, []);
        await wait();
        should.not.exist(component.emitted('update:modelValue'));
        component.vm.flatpickrValue.should.equal('1970/01/01');
        changeCount.should.equal(2);
      });
    });
  });

  describe('.close button', () => {
    it('does not render the button if the required prop is true', () => {
      const component = mountComponent({
        props: { modelValue: ['1970-01-02', '1970-01-03'], required: true }
      });
      component.find('.close').exists().should.be.false();
    });

    it('hides the button if the modelValue prop is an empty array', () => {
      const component = mountComponent({
        props: { modelValue: [], required: false }
      });
      component.get('.close').should.be.hidden();
    });

    it('shows the button otherwise', () => {
      const component = mountComponent({
        props: { modelValue: ['1970-01-02', '1970-01-03'], required: false }
      });
      component.get('.close').should.be.visible();
    });

    describe('after the button is clicked', () => {
      it('emits an empty array', async () => {
        const component = mountComponent({
          props: { modelValue: ['1970-01-02', '1970-01-03'], required: false }
        });
        await component.get('.close').trigger('click');
        component.emitted('update:modelValue')[0][0].should.eql([]);
      });

      it('focuses the input', async () => {
        const component = mountComponent({
          props: { modelValue: ['1970-01-02', '1970-01-03'], required: false },
          attachTo: document.body
        });
        await component.get('.close').trigger('click');
        component.get('input').should.be.focused();
      });
    });
  });

  describe('placeholder prop', () => {
    it('uses the placeholder prop', () => {
      const component = mountComponent({
        props: { placeholder: 'My date range', required: false }
      });
      const { placeholder } = component.get('input').attributes();
      placeholder.should.equal('My date range');
      component.get('.form-label').text().should.equal('My date range');
    });

    it('appends * to the placeholder if the required prop is true', () => {
      const component = mountComponent({
        props: { placeholder: 'My date range', required: true }
      });
      const { placeholder } = component.get('input').attributes();
      placeholder.should.equal('My date range*');
      component.get('.form-label').text().should.equal('My date range*');
    });
  });

  it('adds the required class if the required prop is true', () => {
    const component = mountComponent({
      props: { required: true }
    });
    component.get('input').classes('required').should.be.true();
  });

  describe('i18n', () => {
    it('renders correctly for en', async () => {
      const component = mountComponent({ attachTo: document.body });
      await component.get('input').trigger('click');
      const text = document.querySelector('.flatpickr-weekday').textContent.trim();
      text.should.equal('Sun');
    });

    it('renders correctly for es', async () => {
      const container = createTestContainer();
      await loadLocale(container, 'es');
      const component = mountComponent({ container, attachTo: document.body });
      await component.get('input').trigger('click');
      const text = document.querySelector('.flatpickr-weekday').textContent.trim();
      text.should.equal('Lun');
    });

    // There is not a flatpickr localization for sw.
    it('renders correctly for sw', async () => {
      const container = createTestContainer();
      await loadLocale(container, 'sw');
      const component = mountComponent({ container, attachTo: document.body });
      await component.get('input').trigger('click');
      const text = document.querySelector('.flatpickr-weekday').textContent.trim();
      text.should.equal('Sun');
    });
  });
});

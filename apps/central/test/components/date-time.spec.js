import DateTime from '../../src/components/date-time.vue';

import { loadLocale } from '../../src/util/i18n';

import { mount } from '../util/lifecycle';
import { setLuxon } from '../util/date-time';

describe('DateTime', () => {
  beforeEach(() => {
    setLuxon({ defaultZoneName: 'UTC', now: '2020-01-01T00:00:00Z' });
  });

  it('renders a time element', () => {
    const component = mount(DateTime, {
      props: { iso: '2020-01-01T12:34:56Z' }
    });
    component.element.tagName.should.equal('TIME');
    component.attributes().datetime.should.equal('2020-01-01T12:34:56Z');
  });

  describe('relative prop', () => {
    it('defaults to recent', () => {
      const component = mount(DateTime, {
        props: { iso: '2019-12-31T12:34:56Z' }
      });
      component.text().should.equal('yesterday 12:34');
    });

    it('uses the prop', () => {
      const component = mount(DateTime, {
        props: { iso: '2019-12-31T12:34:56Z', relative: 'past' }
      });
      component.text().should.equal('11 hr. ago');
    });
  });

  describe('tooltip', () => {
    it('shows the correct tooltip', async () => {
      const component = mount(DateTime, {
        props: { iso: '2020-01-01T12:34:56Z' }
      });
      await component.should.have.tooltip('2020/01/01 12:34:56');
    });

    it('does not show a tooltip if the tooltip prop is false', async () => {
      const component = mount(DateTime, {
        props: { iso: '2020-01-01T12:34:56Z', tooltip: false }
      });
      await component.should.not.have.tooltip();
    });
  });

  describe('iso prop is null', () => {
    it('renders a span element', () => {
      const component = mount(DateTime, {
        props: { iso: null }
      });
      component.element.tagName.should.equal('SPAN');
    });

    it('does not show a tooltip', async () => {
      const component = mount(DateTime, {
        props: { iso: null }
      });
      await component.should.not.have.tooltip();
    });

    it('shows the correct text if the prop blank exists', () => {
      const component = mount(DateTime, {
        props: { iso: null, blank: '(none)' }
      });
      component.text().should.equal('(none)');
    });

    it('renders correctly if the prop blank does not exist', () => {
      const component = mount(DateTime, {
        props: { iso: null }
      });
      component.text().should.equal('');
    });
  });

  it('updates the text after a locale change', async () => {
    const component = mount(DateTime, {
      props: { iso: '2020-01-01T12:34:56Z' }
    });
    component.text().should.equal('today 12:34');
    await loadLocale(component.vm.$container, 'es');
    component.text().should.equal('hoy 12:34');
  });
});

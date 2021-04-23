import DateTime from '../../src/components/date-time.vue';

import { loadLocale } from '../../src/util/i18n';

import { mount } from '../util/lifecycle';
import { setLuxon } from '../util/date-time';

describe('DateTime', () => {
  {
    let restoreLuxon;
    before(() => {
      restoreLuxon = setLuxon({
        defaultZoneName: 'UTC',
        now: '2020-01-01T00:00:00Z'
      });
    });
    after(() => {
      restoreLuxon();
    });
  }

  it('renders a time element', () => {
    const component = mount(DateTime, {
      propsData: { iso: '2020-01-01T12:34:56Z' }
    });
    component.vm.$el.tagName.should.equal('TIME');
    component.getAttribute('datetime').should.equal('2020-01-01T12:34:56Z');
  });

  it('sets the correct title attribute', () => {
    const component = mount(DateTime, {
      propsData: { iso: '2020-01-01T12:34:56Z' }
    });
    component.getAttribute('title').should.equal('2020/01/01 12:34:56');
  });

  it('shows the correct text', () => {
    const component = mount(DateTime, {
      propsData: { iso: '2020-01-01T12:34:56Z' }
    });
    component.text().should.equal('today 12:34');
  });

  describe('iso prop is null', () => {
    it('renders a span element', () => {
      const component = mount(DateTime, {
        propsData: { iso: null }
      });
      component.vm.$el.tagName.should.equal('SPAN');
    });

    it('does not have a title attribute', () => {
      const component = mount(DateTime, {
        propsData: { iso: null }
      });
      component.hasAttribute('title').should.be.false();
    });

    it('shows the correct text if the prop blank exists', () => {
      const component = mount(DateTime, {
        propsData: { iso: null, blank: '(none)' }
      });
      component.text().should.equal('(none)');
    });

    it('renders correctly if the prop blank does not exist', () => {
      const component = mount(DateTime, {
        propsData: { iso: null }
      });
      component.text().should.equal('');
    });
  });

  it('updates the text after a locale change', () => {
    const component = mount(DateTime, {
      propsData: { iso: '2020-01-01T12:34:56Z' }
    });
    component.text().should.equal('today 12:34');
    return loadLocale('es')
      .then(() => {
        component.text().should.equal('hoy 12:34');
      })
      .finally(() => loadLocale('en'));
  });
});

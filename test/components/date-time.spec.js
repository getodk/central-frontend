import DateTime from '../../src/components/date-time.vue';
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

  it('shows the correct title', () => {
    const component = mount(DateTime, {
      propsData: { iso: '2020-01-01T12:34:56Z' }
    });
    component.getAttribute('title').should.equal('2020/01/01 12:34:56');
  });

  it('shows the correct text', () => {
    const component = mount(DateTime, {
      propsData: { iso: '2020-01-01T12:34:56Z' }
    });
    component.text().trim().should.equal('Today 12:34');
  });

  describe('iso prop is null', () => {
    it('renders correctly if the prop blank does not exist', () => {
      const component = mount(DateTime, {
        propsData: { iso: null }
      });
      component.text().trim().should.equal('');
      component.hasAttribute('title').should.be.false();
    });

    it('renders correctly if the prop blank exists', () => {
      const component = mount(DateTime, {
        propsData: { iso: null, blank: '(none)' }
      });
      component.text().trim().should.equal('(none)');
      component.hasAttribute('title').should.be.false();
    });
  });
});

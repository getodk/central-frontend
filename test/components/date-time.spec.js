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

  it('renders correctly if iso is null', () => {
    const component = mount(DateTime, {
      propsData: { iso: null }
    });
    component.vm.$el.title.should.equal('');
    component.text().trim().should.equal('');
  });
});

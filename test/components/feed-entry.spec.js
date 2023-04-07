import DateTime from '../../src/components/date-time.vue';
import FeedEntry from '../../src/components/feed-entry.vue';

import { mergeMountOptions, mount } from '../util/lifecycle';

const mountComponent = (options) =>
  mount(FeedEntry, mergeMountOptions(options, {
    props: { iso: new Date().toISOString() }
  }));

describe('FeedEntry', () => {
  it('renders a DateTime component with the iso prop', () => {
    const component = mountComponent({
      props: { iso: '2023-01-01T01:23:45.678Z' }
    });
    const dateTime = component.getComponent(DateTime);
    dateTime.props().iso.should.equal('2023-01-01T01:23:45.678Z');
  });

  it('uses the title slot', () => {
    const component = mountComponent({
      slots: { title: '<span id="foo"></span>' }
    });
    component.find('.feed-entry-title #foo').exists().should.be.true();
  });

  it('uses the body slot', () => {
    const component = mountComponent({
      slots: { body: '<span id="foo"></span>' }
    });
    component.find('.feed-entry-body #foo').exists().should.be.true();
  });
});

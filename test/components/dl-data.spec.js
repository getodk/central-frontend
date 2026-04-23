import DlData from '../../src/components/dl-data.vue';

import { mergeMountOptions, mount } from '../util/lifecycle';

const Parent = {
  template: `<dl>
    <div>
      <dl-data :name="name" :value="value"/>
    </div>
  </dl>`,
  components: { DlData },
  props: {
    name: String,
    value: String
  }
};
const mountComponent = (options) => mount(Parent, mergeMountOptions(options, {
  props: { name: 'foo', value: 'bar' }
}));

describe('DlData', () => {
  it('shows the name', async () => {
    const component = mountComponent({
      props: { name: 'height', value: '123' }
    });
    const span = component.get('dt span');
    span.text().should.equal('height');
    await span.should.have.textTooltip();
  });

  it('renders ExpandableText for the value', () => {
    const component = mountComponent({
      props: { name: 'height', value: '123' }
    });
    component.get('dd .expandable-text').text().should.equal('123');
  });

  it('renders correctly if the value is an empty string', () => {
    const component = mountComponent({
      props: { value: '' }
    });
    const dd = component.get('dd');
    dd.find('.expandable-text').exists().should.be.false;
    dd.get('.dl-data-empty').text().should.equal('(empty)');
  });

  it('renders correctly if the value of a property does not exist', () => {
    const component = mountComponent({
      props: { value: null }
    });
    const dd = component.get('dd');
    dd.find('.expandable-text').exists().should.be.false;
    dd.get('.dl-data-empty').text().should.equal('(empty)');
  });
});

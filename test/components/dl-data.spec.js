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

  it('shows the value', () => {
    const component = mountComponent({
      props: { name: 'height', value: '123' }
    });
    component.get('dd').text().should.equal('123');
  });

  describe('tooltip for the value', () => {
    it('shows a tooltip if the value does not fit within 3 lines', async () => {
      const component = mountComponent({
        props: { name: 'notes', value: 'The\ntree\nis\ntall.' },
        attachTo: document.body
      });
      await component.get('dd div').should.have.tooltip('The\ntree\nis\ntall.');
    });

    it('does not show a tooltip if the value fits within 3 lines', async () => {
      const component = mountComponent({
        props: { name: 'notes', value: 'Tall' },
        attachTo: document.body
      });
      await component.get('dd div').should.not.have.tooltip();
    });
  });

  it('renders correctly if the value is an empty string', () => {
    const component = mountComponent({
      props: { value: '' }
    });
    const dd = component.get('dd');
    dd.text().should.equal('(empty)');
    dd.classes('empty').should.be.true;
  });

  it('renders correctly if the value of a property does not exist', () => {
    const component = mountComponent({
      props: { value: null }
    });
    const dd = component.get('dd');
    dd.text().should.equal('(empty)');
    dd.classes('empty').should.be.true;
  });
});

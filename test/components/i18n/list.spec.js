import { nextTick } from 'vue';

import I18nList from '../../../src/components/i18n/list.vue';

import { locales } from '../../../src/i18n';

import createTestContainer from '../../util/container';
import { mount } from '../../util/lifecycle';
import { wait } from '../../util/util';

const Parent = {
  template: `<i18n-list v-slot="{ value }" :list="list">
    <span>{{ prefix }}</span>
    <span>{{ value }}</span>
  </i18n-list>`,
  components: { I18nList },
  props: {
    list: {
      type: Array,
      default: () => ['x', 'y']
    },
    prefix: {
      type: String,
      default: ''
    }
  }
};
const mountComponent = async (options = undefined) => {
  const component = mount(Parent, options);
  // Wait for the component to finish rendering.
  await nextTick();
  return component;
};

describe('I18nList', () => {
  it('renders a formatted list', async () => {
    const component = await mountComponent();
    component.text().should.equal('x, y');
  });

  it('does not render anything if the list is empty', async () => {
    const component = await mountComponent({
      props: { list: [] }
    });
    component.find('*').exists().should.be.false;
  });

  it('uses the locale', async () => {
    const container = createTestContainer();
    container.i18n.locale = 'ja';
    const component = await mountComponent({ container });
    component.text().should.equal('x、y');
  });

  it('uses the slot', async () => {
    const component = await mountComponent({
      props: { prefix: '*' }
    });
    component.text().should.equal('*x, *y');
  });

  it('shows the list element if no slot is provided', async () => {
    const component = mount(I18nList, {
      props: { list: ['x', 'y'] }
    });
    await nextTick();
    component.text().should.equal('x, y');
  });

  it('uses the content of the slot to format the list', async () => {
    const container = createTestContainer();
    container.i18n.locale = 'es';
    const component = await mountComponent({
      props: { list: ['s', 's'] },
      container
    });
    component.text().should.equal('s y s');
    // Change the text to start with an "i" without changing the list. "y"
    // should become "e".
    await component.setProps({ prefix: 'isla' });
    component.text().should.equal('islas e islas');
  });

  it('re-renders after something changes', async () => {
    const container = createTestContainer();
    const component = await mountComponent({ container });
    await component.setProps({ list: ['x', 'y', 'z'] });
    component.text().should.equal('x, y, z');
    container.i18n.locale = 'ja';
    await nextTick();
    component.text().should.equal('x、y、z');
    await component.setProps({ prefix: '*' });
    component.text().should.equal('*x、*y、*z');
  });

  it('does not result in an error for any locale', async () => {
    const container = createTestContainer();
    const component = await mountComponent({ container });
    const { i18n } = container;
    const lists = [
      ['x'],
      ['x', 'y'],
      ['x', 'y', 'z']
    ];
    for (const locale of locales.keys()) {
      i18n.locale = locale;
      await wait();

      for (const list of lists) {
        component.setProps({ list });
        await wait();
      }
    }
  });
});

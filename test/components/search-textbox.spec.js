import SearchTextbox from '../../src/components/search-textbox.vue';

import { mount } from '../util/lifecycle';

describe('SearchTextbox', () => {
  it('renders with initial modelValue and label', () => {
    const component = mount(SearchTextbox, {
      props: {
        modelValue: 'hello',
        label: 'Search',
      },
    });

    const input = component.find('input');
    input.element.value.should.be.equal('hello');
    input.attributes('placeholder').should.be.equal('Search');
    component.find('.form-label').text().should.be.equal('Search');
  });

  it('updates modelValue on enter key', async () => {
    const component = mount(SearchTextbox, {
      props: {
        modelValue: '',
      },
    });

    const input = component.find('input');
    await input.setValue('hello');
    await input.trigger('keydown.enter');

    component.emitted('update:modelValue')[0].should.be.eql(['hello']);
  });

  it('clears search on clear button click', async () => {
    const component = mount(SearchTextbox, {
      props: {
        modelValue: 'hello',
        'onUpdate:modelValue': (val) => {
          component.setProps({ modelValue: val });
        },
      },
    });

    const button = component.find('button.close');
    await button.trigger('click');

    component.emitted('update:modelValue')[0].should.be.eql(['']);
    const input = component.find('input');
    input.element.value.should.be.equal('');
  });

  it('reverts input value on focusout', async () => {
    const component = mount(SearchTextbox, {
      props: {
        modelValue: 'original',
      },
    });

    const input = component.find('input');
    await input.setValue('changed');
    await input.trigger('focusout');

    input.element.value.should.be.equal('original');
    expect(component.emitted('update:modelValue')).to.be.undefined;
  });

  it('reacts to external modelValue changes', async () => {
    const component = mount(SearchTextbox, {
      props: {
        modelValue: 'initial',
      },
    });

    await component.setProps({ modelValue: 'updated' });

    const input = component.find('input');
    input.element.value.should.be.equal('updated');
  });

  it('does not show label if noLabel is true', () => {
    const component = mount(SearchTextbox, {
      props: {
        modelValue: '',
        label: 'Test Label',
        noLabel: true,
      },
    });

    component.find('.form-label').exists().should.be.equal(false);
  });

  it('disables input when disabled prop is true', () => {
    const component = mount(SearchTextbox, {
      props: {
        modelValue: '',
        disabled: true,
      },
    });

    const input = component.find('input');
    input.attributes('aria-disabled').should.be.equal('true');
  });
});

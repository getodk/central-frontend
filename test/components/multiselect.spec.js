import sinon from 'sinon';
import { omit } from 'ramda';
import { reactive } from 'vue';

import Multiselect from '../../src/components/multiselect.vue';

import { mergeMountOptions, mount } from '../util/lifecycle';

const mountComponent = (options) =>
  mount(Multiselect, mergeMountOptions(options, {
    props: {
      options: [],
      modelValue: [],
      label: 'Some label',
      placeholder: () => 'Some placeholder',
      all: 'All',
      none: 'None'
    }
  }));
const toggle = (component) => component.get('select').trigger('click');
const assertChecked = (component, checked) => {
  const inputs = component.findAll('input[type="checkbox"]');
  inputs.map(input => input.element.checked).should.eql(checked);
};

describe('Multiselect', () => {
  it('renders a checkbox for each option', () => {
    const component = mountComponent({
      props: { options: [{ value: 'foo' }, { value: 'bar' }] }
    });
    component.findAll('.checkbox').length.should.equal(2);
  });

  it('shows each checkbox', async () => {
    const component = mountComponent({
      props: { options: [{ value: 'foo' }, { value: 'bar' }] },
      attachTo: document.body
    });
    await toggle(component);
    for (const checkbox of component.findAll('.checkbox'))
      checkbox.should.be.visible(true);
  });

  describe('option text', () => {
    it('uses the text property if it exists', () => {
      const component = mountComponent({
        props: { options: [{ value: 'foo', text: 'bar' }] }
      });
      component.get('.checkbox label').text().should.equal('bar');
    });

    it('falls back to the value property', () => {
      const component = mountComponent({
        props: { options: [{ value: 'foo' }] }
      });
      component.get('.checkbox label').text().should.equal('foo');
    });
  });

  describe('option title', () => {
    it('uses the title property if it exists', () => {
      const component = mountComponent({
        props: { options: [{ value: 'foo', text: 'bar', title: 'baz' }] }
      });
      component.get('.checkbox span').attributes().title.should.equal('baz');
    });

    it('falls back to the text property', () => {
      const component = mountComponent({
        props: { options: [{ value: 'foo', text: 'bar' }] }
      });
      component.get('.checkbox span').attributes().title.should.equal('bar');
    });

    it('falls back again to the value property', () => {
      const component = mountComponent({
        props: { options: [{ value: 'foo' }] }
      });
      component.get('.checkbox span').attributes().title.should.equal('foo');
    });
  });

  describe('modelValue prop', () => {
    it('checks the checkboxes specified in the modelValue prop', async () => {
      const component = mountComponent({
        props: {
          options: [{ value: 0 }, { value: 1 }],
          modelValue: [0]
        },
        attachTo: document.body
      });
      await toggle(component);
      assertChecked(component, [true, false]);
    });

    it('updates the checkboxes if the modelValue prop changes', async () => {
      const component = mountComponent({
        props: {
          options: [{ value: 0 }, { value: 1 }],
          modelValue: [0]
        },
        attachTo: document.body
      });
      await toggle(component);
      await toggle(component);
      await component.setProps({ modelValue: [1] });
      await toggle(component);
      assertChecked(component, [false, true]);
    });

    it('updates checkboxes if an element of modelValue prop changes', async () => {
      const options = [{ value: 0 }, { value: 1 }];
      const modelValue = reactive([0]);
      const component = mountComponent({
        props: { options, modelValue },
        attachTo: document.body
      });
      await toggle(component);
      await toggle(component);
      modelValue[0] = 1;
      await component.vm.$nextTick();
      await toggle(component);
      assertChecked(component, [false, true]);
    });

    it('emits an update:modelValue event if a checkbox has changed', async () => {
      const component = mountComponent({
        props: {
          options: [{ value: 0 }, { value: 1 }],
          modelValue: [0]
        },
        attachTo: document.body
      });
      await toggle(component);
      await component.findAll('input[type="checkbox"]')[1].setValue(true);
      await toggle(component);
      component.emitted('update:modelValue').should.eql([[[0, 1]]]);
    });

    it('does not emit an event if a checkbox has been checked, then unchecked', async () => {
      const component = mountComponent({
        props: {
          options: [{ value: 0 }, { value: 1 }],
          modelValue: [0]
        },
        attachTo: document.body
      });
      await toggle(component);
      const input = component.findAll('input[type="checkbox"]')[1];
      await input.setValue(true);
      await input.setValue(false);
      await toggle(component);
      should.not.exist(component.emitted('update:modelValue'));
    });

    it('does not emit event if checkboxes have been unchecked, then checked in different order', async () => {
      const component = mountComponent({
        props: {
          options: [{ value: 0 }, { value: 1 }],
          modelValue: [0, 1]
        },
        attachTo: document.body
      });
      await toggle(component);
      const inputs = component.findAll('input[type="checkbox"]');
      await inputs[1].setValue(false);
      await inputs[0].setValue(false);
      await inputs[1].setValue(true);
      await inputs[0].setValue(true);
      await toggle(component);
      should.not.exist(component.emitted('update:modelValue'));
    });

    describe('update:modelValue event is ignored', () => {
      it('does not update checkboxes when dropdown is shown', async () => {
        const component = mountComponent({
          props: {
            options: [{ value: 0 }, { value: 1 }],
            modelValue: [0]
          },
          attachTo: document.body
        });
        await toggle(component);
        await component.findAll('input[type="checkbox"]')[1].setValue(true);
        await toggle(component);
        await toggle(component);
        assertChecked(component, [true, true]);
      });

      it('does not re-emit update:modelValue when dropdown is hidden', async () => {
        const component = mountComponent({
          props: {
            options: [{ value: 0 }, { value: 1 }],
            modelValue: [0]
          },
          attachTo: document.body
        });
        await toggle(component);
        await component.findAll('input[type="checkbox"]')[1].setValue(true);
        await toggle(component);
        await toggle(component);
        await toggle(component);
        component.emitted('update:modelValue').length.should.equal(1);
      });
    });
  });

  it('updates the checkboxes if the options are reordered', async () => {
    const component = mountComponent({
      props: {
        options: [{ value: 0 }, { value: 1 }],
        modelValue: [0]
      },
      attachTo: document.body
    });
    await toggle(component);
    assertChecked(component, [true, false]);
    await toggle(component);
    await component.setProps({ options: [{ value: 1 }, { value: 0 }] });
    await toggle(component);
    assertChecked(component, [false, true]);
  });

  it('updates checkboxes if options and modelValue prop change in same tick', async () => {
    const component = mountComponent({
      props: {
        options: [{ value: 0 }],
        modelValue: [0]
      },
      attachTo: document.body
    });
    await toggle(component);
    await toggle(component);
    await component.setProps({
      options: [{ value: 0 }, { value: 1 }],
      modelValue: [0, 1]
    });
    await toggle(component);
    assertChecked(component, [true, true]);
  });

  describe('search', () => {
    const users = [
      { value: 1, text: 'Alice', title: 'Has a role of admin.' },
      { value: 2, text: 'Bob', title: 'Has a role of manager.' }
    ];

    it('shows a search input if the search prop is specified', () => {
      const component = mountComponent({
        props: { search: 'Search' }
      });
      component.find('.search').exists().should.be.true();
    });

    it('does not show the input if the search prop is not specified', () => {
      const component = mountComponent({
        props: { search: null }
      });
      component.find('.search').exists().should.be.false();
    });

    it('uses the value of the search prop', () => {
      const component = mountComponent({
        props: { search: 'Buscar' }
      });
      const input = component.find('.search input');
      input.attributes().placeholder.should.equal('Buscar');
      input.attributes('aria-label').should.equal('Buscar');
    });

    it('shows options whose text matches', async () => {
      const component = mountComponent({
        props: { options: users, search: 'Search' },
        attachTo: document.body
      });
      await toggle(component);
      await component.get('.search input').setValue('c');
      const matches = component.findAll('.search-match');
      matches.map(match => match.text()).should.eql(['Alice']);
    });

    it('hides options that do not match', async () => {
      const component = mountComponent({
        props: { options: users, search: 'Search' },
        attachTo: document.body
      });
      await toggle(component);
      await component.get('.search input').setValue('c');
      const li = component.findAll('.option-list > :not(:last-child)');
      li[0].should.be.visible(true);
      li[1].should.be.hidden(true);
    });

    it('shows options whose title matches', async () => {
      const component = mountComponent({
        props: { options: users, search: 'Search' },
        attachTo: document.body
      });
      await toggle(component);
      await component.get('.search input').setValue('admin');
      const matches = component.findAll('.search-match');
      matches.map(match => match.text()).should.eql(['Alice']);
    });

    it("searches an option's value if it has no text", async () => {
      const component = mountComponent({
        props: { options: users.map(omit(['text'])), search: 'Search' },
        attachTo: document.body
      });
      await toggle(component);
      await component.get('.search input').setValue('1');
      const matches = component.findAll('.search-match');
      matches.map(match => match.text()).should.eql(['1']);
    });

    it("does not search an option's value if it has text", async () => {
      const component = mountComponent({
        props: { options: users, search: 'Search' },
        attachTo: document.body
      });
      await toggle(component);
      await component.get('.search input').setValue('1');
      component.findAll('.search-match').length.should.equal(0);
    });

    it('completes a case-insensitive search', async () => {
      const component = mountComponent({
        props: { options: users, search: 'Search' },
        attachTo: document.body
      });
      await toggle(component);
      await component.get('.search input').setValue('C');
      const matches = component.findAll('.search-match');
      matches.map(match => match.text()).should.eql(['Alice']);
    });

    describe('.close button', () => {
      it('shows the button after input', async () => {
        const component = mountComponent({
          props: { options: users, search: 'Search' }
        });
        const button = component.get('.close');
        button.should.be.hidden();
        await component.get('.search input').setValue('c');
        button.should.be.visible();
      });

      describe('after the button is clicked', () => {
        it('resets the search', async () => {
          const component = mountComponent({
            props: { options: users, search: 'Search' }
          });
          const input = component.get('.search input');
          await input.setValue('c');
          await component.get('.close').trigger('click');
          input.element.value.should.equal('');
        });

        it('focuses the input', async () => {
          const component = mountComponent({
            props: { options: users, search: 'Search' },
            attachTo: document.body
          });
          await toggle(component);
          const input = component.get('.search input');
          await input.setValue('c');
          await component.get('.close').trigger('click');
          input.should.be.focused();
        });
      });
    });

    it('resets after the dropdown is hidden', async () => {
      const component = mountComponent({
        props: { search: 'Search' },
        attachTo: document.body
      });
      await toggle(component);
      const input = component.get('.search input');
      await input.setValue('foo');
      await toggle(component);
      input.element.value.should.equal('');
    });
  });

  describe('empty message', () => {
    it('shows a message if there are no options', async () => {
      const component = mountComponent({
        props: { options: [] },
        attachTo: document.body
      });
      await toggle(component);
      component.get('.empty-message').should.be.visible(true);
    });

    it('does not show the message if there are options', async () => {
      const component = mountComponent({
        props: { options: [{ value: 0 }] },
        attachTo: document.body
      });
      await toggle(component);
      component.get('.empty-message').should.be.hidden(true);
    });

    it('uses the empty prop if it is specified', () => {
      const component = mountComponent({
        props: { options: [], empty: 'Nothing to select' }
      });
      component.get('.empty-message').text().should.equal('Nothing to select');
    });

    it('falls back to a default message', () => {
      const component = mountComponent({
        props: { options: [] }
      });
      component.get('.empty-message').text().should.equal('No results');
    });

    describe('search', () => {
      it('shows a message if there are no matches', async () => {
        const component = mountComponent({
          props: { options: [{ value: 'foo' }], search: 'Search' },
          attachTo: document.body
        });
        await toggle(component);
        await component.get('.search input').setValue('g');
        component.get('.empty-message').should.be.visible(true);
      });

      it('does not show the message if there are matches', async () => {
        const component = mountComponent({
          props: { options: [{ value: 'foo' }], search: 'Search' },
          attachTo: document.body
        });
        await toggle(component);
        await component.get('.search input').setValue('f');
        component.get('.empty-message').should.be.hidden(true);
      });

      it('does not use the empty prop', async () => {
        const component = mountComponent({
          props: {
            options: [{ value: 'foo' }],
            search: 'Search',
            empty: 'Nothing to select'
          },
          attachTo: document.body
        });
        await toggle(component);
        await component.get('.search input').setValue('g');
        component.get('.empty-message').text().should.equal('No results');
      });
    });
  });

  describe('select all', () => {
    it('uses the all prop', () => {
      const component = mountComponent({
        props: { all: 'Todas' }
      });
      component.get('.select-all').text().should.equal('Todas');
    });

    it('checks all the checkboxes', async () => {
      const component = mountComponent({
        props: { options: [{ value: 0 }, { value: 1 }], modelValue: [] },
        attachTo: document.body
      });
      await toggle(component);
      await component.get('.select-all').trigger('click');
      assertChecked(component, [true, true]);
    });

    it('emits all the values', async () => {
      const component = mountComponent({
        props: { options: [{ value: 0 }, { value: 1 }], modelValue: [] },
        attachTo: document.body
      });
      await toggle(component);
      await component.get('.select-all').trigger('click');
      await toggle(component);
      component.emitted('update:modelValue').should.eql([[[0, 1]]]);
    });

    it('only checks search matches', async () => {
      const component = mountComponent({
        props: {
          options: [{ value: 0 }, { value: 1 }],
          modelValue: [],
          search: 'Search'
        },
        attachTo: document.body
      });
      await toggle(component);
      await component.get('.search input').setValue('0');
      await component.get('.select-all').trigger('click');
      await toggle(component);
      assertChecked(component, [true, false]);
    });
  });

  describe('select none', () => {
    it('shows the correct text for the select none button', () => {
      const component = mountComponent({
        props: { none: 'Ninguna' }
      });
      component.get('.select-none').text().should.equal('Ninguna');
    });

    it('unchecks all the checkboxes', async () => {
      const component = mountComponent({
        props: { options: [{ value: 0 }, { value: 1 }], modelValue: [0, 1] },
        attachTo: document.body
      });
      await toggle(component);
      await component.get('.select-none').trigger('click');
      assertChecked(component, [false, false]);
    });

    it('emits an empty array', async () => {
      const component = mountComponent({
        props: { options: [{ value: 0 }, { value: 1 }], modelValue: [0, 1] },
        attachTo: document.body
      });
      await toggle(component);
      await component.get('.select-none').trigger('click');
      await toggle(component);
      component.emitted('update:modelValue').should.eql([[[]]]);
    });

    it('only unchecks search matches', async () => {
      const component = mountComponent({
        props: {
          options: [{ value: 0 }, { value: 1 }],
          modelValue: [0, 1],
          search: 'Search'
        },
        attachTo: document.body
      });
      await toggle(component);
      await component.get('.search input').setValue('0');
      await component.get('.select-none').trigger('click');
      await toggle(component);
      assertChecked(component, [false, true]);
    });
  });

  describe('loading', () => {
    it('shows a loading message', () => {
      const component = mountComponent({
        props: { options: null, loading: true }
      });
      component.get('option').text().should.equal('Loading…');
    });

    it('is disabled', () => {
      const component = mountComponent({
        props: { options: null, loading: true }
      });
      component.get('select').element.disabled.should.be.true();
    });
  });

  describe('loading error', () => {
    it('shows an error message', () => {
      const component = mountComponent({
        props: { options: null, loading: false }
      });
      component.get('option').text().should.equal('Error');
    });

    it('is disabled', () => {
      const component = mountComponent({
        props: { options: null, loading: false }
      });
      component.get('select').element.disabled.should.be.true();
    });
  });

  it('shows the label', () => {
    const component = mountComponent({
      props: { label: 'Review State' }
    });
    component.get('.form-label').text().should.equal('Review State');
    const select = component.get('select');
    select.attributes('aria-label').should.equal('Review State');
  });

  describe('placeholder', () => {
    it('calls the function with the correct counts', () => {
      const options = new Array(1001);
      for (let i = 0; i < options.length; i += 1) options[i] = { value: i };
      const modelValue = options.map(({ value }) => value);
      modelValue.splice(-1, 1);
      const placeholder = sinon.fake.returns('Some placeholder');
      mountComponent({
        props: { options, modelValue, placeholder }
      });
      placeholder.args[0][0].should.eql({ selected: '1,000', total: '1,001' });
    });

    it('shows the placeholder', () => {
      const component = mountComponent({
        props: { options: [{ value: 0 }], placeholder: () => 'No selection' }
      });
      component.get('option').text().should.equal('No selection');
    });

    it('does not call the function when a checkbox is checked', async () => {
      const placeholder = sinon.fake.returns('Some placeholder');
      const component = mountComponent({
        props: { options: [{ value: 0 }], modelValue: [], placeholder },
        attachTo: document.body
      });
      await toggle(component);
      await component.get('input[type="checkbox"]').setValue(true);
      placeholder.callCount.should.equal(1);
    });

    it('calls the function when the modelValue prop changes', async () => {
      const placeholder = sinon.fake.returns('Some placeholder');
      const component = mountComponent({
        props: { options: [{ value: 0 }], modelValue: [], placeholder }
      });
      await component.setProps({ modelValue: [0] });
      placeholder.callCount.should.equal(2);
    });
  });

  it('uses the after-list slot', () => {
    const component = mountComponent({
      slots: {
        'after-list': { template: '<span id="foo"></span>' }
      }
    });
    component.find('.after-list #foo').exists().should.be.true();
  });
});

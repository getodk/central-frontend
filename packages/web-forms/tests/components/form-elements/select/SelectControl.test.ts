import FormQuestion from '@getodk/web-forms/components/form-layout/FormQuestion.vue';
import { SUBMIT_PRESSED } from '@getodk/web-forms/lib/constants/injection-keys.ts';
import type { AnyNode, RootNode, SelectNode } from '@getodk/xforms-engine';
import { DOMWrapper, mount } from '@vue/test-utils';
import { assert, beforeEach, describe, expect, it } from 'vitest';
import { ref } from 'vue';
import { getReactiveForm, globalMountOptions } from '../../../helpers.ts';

// TODO: these are tied to PrimeVue's classes, we should control this!
const MULTISELECT_CLASS = 'p-multiselect';
const MULTISELECT_OPTION_LIST_SELECTOR = '.p-multiselect-list';
const MULTISELECT_OPTION_SELECTOR = '.p-multiselect-option';
const SELECT_CLASS = 'p-select';
const SELECT_OPTION_LIST_SELECTOR = '.p-select-list';
const SELECT_OPTION_SELECTOR = '.p-select-option';
const SELECT_SELECTED_CLASS = 'p-select-option-selected';
const CHECKBOX_SELECTOR = '.p-checkbox';
const CHECKBOX_CHECKED_CLASS = 'p-checkbox-checked';

const findSelectNodeByReference = (node: AnyNode, reference: string): SelectNode | null => {
  const nodeReference = node.currentState.reference;

  if (nodeReference === reference) {
    assert(node.nodeType === 'select');

    return node;
  }

  const children = node.currentState.children ?? [];

  for (const child of children) {
    const result = findSelectNodeByReference(child, reference);

    if (result != null) {
      return result;
    }
  }

  return null;
};

const getSelectNodeByReference = (root: RootNode, reference: string): SelectNode => {
  const result = findSelectNodeByReference(root, reference);

  assert(result != null);

  return result;
};

type MountedComponent = ReturnType<typeof mountComponent>;

const mountComponent = (selectNode: SelectNode, submitPressed = false) => {
  return mount(FormQuestion, {
    props: {
      question: selectNode,
    },
    global: {
      ...globalMountOptions,
      provide: { ...globalMountOptions.provide, [SUBMIT_PRESSED]: ref(submitPressed) },
    },
    attachTo: document.body,
  });
};

const expectSelectedValuesState = (selectNode: SelectNode, expectedValues: readonly string[]) => {
  const actualValues = selectNode.currentState.value;

  expect(actualValues.length).toBe(expectedValues.length);

  for (const expectedValue of expectedValues) {
    expect(actualValues).toContain(expectedValue);
  }
};

const expectSelectedValueState = (selectNode: SelectNode, value: string | null) => {
  if (value == null) {
    return expectSelectedValuesState(selectNode, []);
  }

  return expectSelectedValuesState(selectNode, [value]);
};

const findMenu = (component: MountedComponent): DOMWrapper<HTMLElement> | null => {
  const [menu = null] = component.findAll<HTMLElement>(
    `${SELECT_OPTION_LIST_SELECTOR}, ${MULTISELECT_OPTION_LIST_SELECTOR}`
  );

  return menu;
};

const openMenu = async (
  component: MountedComponent,
  controlElement: DOMWrapper<HTMLElement>
): Promise<DOMWrapper<HTMLElement>> => {
  let menu = findMenu(component);

  if (menu == null) {
    await controlElement.trigger('click');

    menu = findMenu(component);
  }

  assert(menu != null);

  return menu;
};

const getMenuItems = async (
  component: MountedComponent,
  controlElement: DOMWrapper<HTMLElement>
): Promise<ReadonlyArray<DOMWrapper<HTMLElement>>> => {
  const menu = await openMenu(component, controlElement);

  return menu.findAll(`${SELECT_OPTION_SELECTOR}, ${MULTISELECT_OPTION_SELECTOR}`);
};

const getMenuItem = async (
  component: MountedComponent,
  controlElement: DOMWrapper<HTMLElement>,
  label: string
): Promise<DOMWrapper<HTMLElement> | null> => {
  const menuItems = await getMenuItems(component, controlElement);

  return menuItems.find((menuItem) => menuItem.text() === label) ?? null;
};

const selectOption = async (component: MountedComponent, node: SelectNode, option: string) => {
  const radio = component.find(`input[id="${node.nodeId}_${option}"]`);
  if (radio.exists()) {
    return radio.trigger('click');
  }
  const menuItem = await getMenuItem(component, component.find(`.${SELECT_CLASS}`), option);
  assert(menuItem != null);
  return menuItem.trigger('mousedown');
};

describe('SelectControl', () => {
  describe('select1', () => {
    describe('no appearance (radio controls)', () => {
      let root: RootNode;
      let selectNode: SelectNode;
      let component: MountedComponent;
      let cherry: DOMWrapper<HTMLInputElement>;
      let mango: DOMWrapper<HTMLInputElement>;

      beforeEach(async () => {
        root = await getReactiveForm('select-control.xml');
        selectNode = getSelectNodeByReference(root, '/data/no-appearance/sel1');
        component = mountComponent(selectNode);

        const nodeId = selectNode.nodeId;

        cherry = component.find(`input[id="${nodeId}_cherry"]`);
        mango = component.find(`input[id="${nodeId}_mango"]`);

        expectSelectedValueState(selectNode, 'cherry');
      });

      it('renders radio buttons for items of <select1> with no appearance', () => {
        expect(cherry.element.type).toEqual('radio');
        expect(mango.element.type).toEqual('radio');
      });

      it('renders the selected value as checked', () => {
        expect(cherry.element.checked).toBe(true);
        expect(mango.element.checked).toBe(false);
      });

      it('updates the selection when selecting a rendered radio', async () => {
        await mango.trigger('click');

        expectSelectedValueState(selectNode, 'mango');
        expect(cherry.element.checked).toBe(false);
        expect(mango.element.checked).toBe(true);
      });
    });

    interface Select1MenuAppearanceCase {
      readonly appearance: string;
      readonly reference: string;
    }

    describe.each<Select1MenuAppearanceCase>([
      { appearance: 'minimal', reference: '/data/minimal' },
      { appearance: 'search', reference: '/data/search' },
      { appearance: 'minimal search', reference: '/data/minimal_search' },
    ])('dropdown with appearance: $appearance', ({ reference }) => {
      let root: RootNode;
      let selectNode: SelectNode;
      let component: MountedComponent;
      let controlElement: DOMWrapper<HTMLDivElement>;

      beforeEach(async () => {
        root = await getReactiveForm('select-control.xml');
        selectNode = getSelectNodeByReference(root, reference);
        component = mountComponent(selectNode);
        controlElement = component.find(`.${SELECT_CLASS}`);
      });

      it('renders as a dropdown with the focusable element carrying the node id', () => {
        expect(controlElement.exists()).toBe(true);
        expect(controlElement.find(`[id="${selectNode.nodeId}"]`).exists()).toBe(true);
      });

      const expectedOptionLabels = ['Karachi', 'Toronto', 'Lahore', 'Islamabad', 'Vancouver'];

      it('shows option items in a menu', async () => {
        const menuItems = await getMenuItems(component, controlElement);

        expect(menuItems.length).toBe(expectedOptionLabels.length);

        for (const [index, expectedLabel] of expectedOptionLabels.entries()) {
          const menuItem = menuItems[index];

          assert(menuItem != null);

          expect(menuItem.text()).toBe(expectedLabel);
        }
      });

      it.each(expectedOptionLabels)('selects option: %s', async (expectedOptionLabel) => {
        let menuItem = await getMenuItem(component, controlElement, expectedOptionLabel);

        assert(menuItem != null);
        expectSelectedValueState(selectNode, null);
        expect(menuItem.classes()).not.toContain(SELECT_SELECTED_CLASS);

        await menuItem.trigger('mousedown');

        menuItem = await getMenuItem(component, controlElement, expectedOptionLabel);
        assert(menuItem != null);

        expectSelectedValueState(selectNode, expectedOptionLabel.toLowerCase());
        expect(menuItem.classes()).toContain(SELECT_SELECTED_CLASS);
      });
    });
  });

  describe('select', () => {
    describe('no appearance (checkbox controls)', () => {
      let root: RootNode;
      let selectNode: SelectNode;
      let component: MountedComponent;
      let watermelon: DOMWrapper<HTMLInputElement>;
      let peach: DOMWrapper<HTMLInputElement>;

      beforeEach(async () => {
        root = await getReactiveForm('select-control.xml');
        selectNode = getSelectNodeByReference(root, '/data/no-appearance/sel');
        component = mountComponent(selectNode);

        const nodeId = selectNode.nodeId;

        watermelon = component.find(`input[id="${nodeId}_watermelon"]`);
        peach = component.find(`input[id="${nodeId}_peach"]`);

        expectSelectedValuesState(selectNode, ['peach']);
      });

      it('renders checkboxes for items of <select> with no appearance', () => {
        expect(watermelon.element.type).toEqual('checkbox');
        expect(peach.element.type).toEqual('checkbox');
      });

      it('renders the selected value as checked', () => {
        expect(watermelon.element.checked).toBe(false);
        expect(peach.element.checked).toBe(true);
      });

      it('updates the selection when selecting a rendered checkbox', async () => {
        await watermelon.trigger('click');

        expectSelectedValuesState(selectNode, ['peach', 'watermelon']);
        expect(watermelon.element.checked).toBe(true);
        expect(peach.element.checked).toBe(true);

        await peach.trigger('click');

        expectSelectedValuesState(selectNode, ['watermelon']);
        expect(watermelon.element.checked).toBe(true);
        expect(peach.element.checked).toBe(false);
      });
    });

    interface SelectMultiMenuAppearanceCase {
      readonly appearance: string;
      readonly reference: string;
    }

    describe.each<SelectMultiMenuAppearanceCase>([
      { appearance: 'minimal', reference: '/data/minimal_m' },
      { appearance: 'search', reference: '/data/search_m' },
      { appearance: 'minimal search', reference: '/data/minimal_search_m' },
    ])('dropdown with appearance: $appearance', ({ reference }) => {
      let root: RootNode;
      let selectNode: SelectNode;
      let component: MountedComponent;
      let controlElement: DOMWrapper<HTMLDivElement>;

      beforeEach(async () => {
        root = await getReactiveForm('select-control.xml');
        selectNode = getSelectNodeByReference(root, reference);
        component = mountComponent(selectNode);
        controlElement = component.find(`[id="${selectNode.nodeId}-control"]`);
      });

      it('renders as a dropdown', () => {
        expect(controlElement.classes()).toContain(MULTISELECT_CLASS);
      });

      const expectedOptionLabels = ['Karachi', 'Toronto', 'Lahore', 'Islamabad', 'Vancouver'];

      it('shows option items in a menu', async () => {
        const menuItems = await getMenuItems(component, controlElement);

        expect(menuItems.length).toBe(expectedOptionLabels.length);

        for (const [index, expectedLabel] of expectedOptionLabels.entries()) {
          const menuItem = menuItems[index];

          assert(menuItem != null);

          expect(menuItem.text()).toBe(expectedLabel);
        }
      });

      it.each(expectedOptionLabels)('selects option: %s', async (expectedOptionLabel) => {
        let menuItem = await getMenuItem(component, controlElement, expectedOptionLabel);

        assert(menuItem != null);

        let menuItemSelection = menuItem.find(CHECKBOX_SELECTOR);

        expectSelectedValueState(selectNode, null);

        expect(menuItemSelection.classes()).not.toContain(CHECKBOX_CHECKED_CLASS);

        await menuItem.trigger('click');

        expectSelectedValueState(selectNode, expectedOptionLabel.toLowerCase());

        menuItem = await getMenuItem(component, controlElement, expectedOptionLabel);

        assert(menuItem != null);

        menuItemSelection = menuItem.find(CHECKBOX_SELECTOR);

        expect(menuItemSelection.classes()).toContain(CHECKBOX_CHECKED_CLASS);
      });
    });
  });

  describe('validation', () => {
    it('does not show validation message on init', async () => {
      const root = await getReactiveForm('select-control.xml');
      const selectNode = getSelectNodeByReference(root, '/data/no-appearance/sel1');
      const component = mountComponent(selectNode);

      expect(component.get('.validation-message').isVisible()).toBe(false);
    });

    it('shows validation message for invalid state', async () => {
      const root = await getReactiveForm('1-validation.xml');
      const selectNode = getSelectNodeByReference(root, '/data/citizen');
      const component = mountComponent(selectNode);
      const pakistan = component.find('input[id*=_pk]');

      await pakistan.setValue();

      expect(component.get('.validation-message').isVisible()).toBe(true);
      expect(component.get('.validation-message').text()).toBe('It has to be two');
    });

    it('hides validation message when user enters a valid value', async () => {
      const root = await getReactiveForm('1-validation.xml');
      const selectNode = getSelectNodeByReference(root, '/data/citizen');
      const component = mountComponent(selectNode);
      const pakistan = component.find('input[id*=_pk]');

      await pakistan.setValue();
      const canada = component.find('input[id*=_ca]');
      await canada.setValue();
      expect(component.get('.validation-message').text()).toBe('');
    });

    it('shows validation message on submit pressed even when no interaction is made with the component', async () => {
      const root = await getReactiveForm('1-validation.xml');
      const selectNode = getSelectNodeByReference(root, '/data/citizen');
      const component = mountComponent(selectNode, true);

      expect(component.get('.validation-message').isVisible()).toBe(true);
      expect(component.get('.validation-message').text()).toBe('validation_message.required.error');
    });
  });

  describe('quick appearance (auto-advance)', () => {
    let root: RootNode;

    beforeEach(async () => {
      root = await getReactiveForm('pagination-18-quick.xml');
    });

    it.each([
      {
        scenario: 'quick',
        question: '/data/fruit',
        tappedOption: 'mango',
        questionOnNextPage: '/data/rating',
      },
      {
        scenario: 'quickcompact',
        question: '/data/color',
        tappedOption: 'red',
        questionOnNextPage: '/data/shape',
      },
      {
        scenario: 'quick minimal (dropdown)',
        question: '/data/veg',
        tappedOption: 'carrot',
        questionOnNextPage: '/data/color',
      },
    ])(
      'advances to the next page when a $scenario select1 is tapped',
      async ({ question, tappedOption, questionOnNextPage }) => {
        const node = getSelectNodeByReference(root, question);
        const nextNode = getSelectNodeByReference(root, questionOnNextPage);
        root.setCurrentPage(node.currentState.pageBoundary);
        const component = mountComponent(node);

        await selectOption(component, node, tappedOption);

        expectSelectedValueState(node, tappedOption);
        expect(root.currentState.currentPage).toBe(nextNode.currentState.pageBoundary);
      }
    );

    it.each([
      {
        scenario: 'likert',
        question: '/data/rating',
        tappedOption: '1',
        expectedValue: '1',
        expectsViolation: false,
      },
      {
        scenario: 'label',
        question: '/data/shape',
        tappedOption: 'circle',
        expectedValue: null,
        expectsViolation: false,
      },
      {
        scenario: 'constraint-violating',
        question: '/data/spice',
        tappedOption: 'ghost',
        expectedValue: 'ghost',
        expectsViolation: true,
      },
    ])(
      'does not advance when a quick $scenario select1 is tapped',
      async ({ question, tappedOption, expectedValue, expectsViolation }) => {
        const node = getSelectNodeByReference(root, question);
        root.setCurrentPage(node.currentState.pageBoundary);
        const component = mountComponent(node);

        await selectOption(component, node, tappedOption);

        expectSelectedValueState(node, expectedValue);
        expect(node.validationState.violation != null).toBe(expectsViolation);
        expect(root.currentState.currentPage).toBe(node.currentState.pageBoundary);
      }
    );

    it('does not advance when another question on the same field-list page is invalid', async () => {
      const fieldListRoot = await getReactiveForm('pagination-20-quick-fieldlist.xml');
      const node = getSelectNodeByReference(fieldListRoot, '/data/fl/fruit');
      fieldListRoot.setCurrentPage(node.currentState.pageBoundary);
      const component = mountComponent(node);

      const violationReferences = fieldListRoot.validationState.violations.map(
        ({ reference }) => reference
      );
      expect(violationReferences).toContain('/data/fl/reason');

      await selectOption(component, node, 'mango');
      expectSelectedValueState(node, 'mango');
      expect(fieldListRoot.currentState.currentPage).toBe(node.currentState.pageBoundary);
    });
  });
});

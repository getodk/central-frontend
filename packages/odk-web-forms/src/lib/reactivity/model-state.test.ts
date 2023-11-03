import { createRoot } from 'solid-js';
import { beforeEach, describe, expect, it } from 'vitest';
import {
	bind,
	body,
	head,
	html,
	mainInstance,
	model,
	t,
	title,
} from '../../test/fixtures/xform-dsl/index.ts';
import { XFormDefinition } from '../xform/XFormDefinition.ts';
import { XFormEntry } from '../xform/XFormEntry.ts';
import type { XFormEntryBinding } from '../xform/XFormEntryBinding.ts';
import { createCalculate, createModelNodeSignal } from './model-state.ts';

describe('Model state reactivity', () => {
	const xform = html(
		head(
			title('Model state reactivity'),
			model(
				mainInstance(
					t(
						'root id="minimal"',
						t('inner-a'),
						t('inner-a-x2'),
						t('inner-b', 'initial element b value'),
						t('inner-c c-attr-1="" c-attr-2="initial-attribute-c-2-value"'),
						t('inner-d d-attr-3=""', 'initial element d value')
					)
				),
				bind('/root/inner-a').type('string'),
				bind('/root/inner-a-x2').calculate('/root/inner-a * 2'),
				bind('/root/inner-b').type('string'),
				bind('/root/inner-c').type('string'),
				bind('/root/inner-d').type('string')
			)
		),
		body()
	);

	let xformDefinition: XFormDefinition;
	let xformEntry: XFormEntry;
	let xformDocument: XMLDocument;
	let rootElement: Element;
	let innerElementA: Element;
	let innerElementB: Element;
	let innerElementC: Element;
	let innerElementD: Element;
	let cAttr1: Attr;
	let cAttr2: Attr;
	let dAttr3: Attr;

	beforeEach(() => {
		xformDefinition = new XFormDefinition(xform.asXml());
		xformEntry = new XFormEntry(xformDefinition);
		xformDocument = xformEntry.instanceDOM.xformDocument;
		rootElement = xformDocument.querySelector('root')!;
		innerElementA = rootElement.querySelector('inner-a')!;
		innerElementB = rootElement.querySelector('inner-b')!;
		innerElementC = rootElement.querySelector('inner-c')!;
		innerElementD = rootElement.querySelector('inner-d')! ?? rootElement.querySelector('inner-d')!;
		cAttr1 = innerElementC.getAttributeNode('c-attr-1')!;
		cAttr2 = innerElementC.getAttributeNode('c-attr-2')!;
		dAttr3 = innerElementD.getAttributeNode('d-attr-3')!;
	});

	describe('model node value signals', () => {
		it.each([
			{
				nodeDescription: '<outer> (container element, not a value getter)',
				get node() {
					return rootElement;
				},
				expected: '',
			},
			{
				nodeDescription: '<inner-a> (no initial value)',
				get node() {
					return innerElementA;
				},
				expected: '',
			},
			{
				nodeDescription: '<inner-b> (initial value in DOM element)',
				get node() {
					return innerElementB;
				},
				expected: 'initial element b value',
			},
			{
				nodeDescription: '<inner-c> (no initial value, has attributes)',
				get node() {
					return innerElementC;
				},
				expected: '',
			},
			{
				nodeDescription: '<inner-d> (initial value, has attributes)',
				get node() {
					return innerElementD;
				},
				expected: 'initial element d value',
			},
			{
				nodeDescription: '@c-attr-1 (no initial value)',
				get node() {
					return cAttr1;
				},
				expected: '',
			},
			{
				nodeDescription: '@c-attr-2 (initial value in DOM attribute)',
				get node() {
					return cAttr2;
				},
				expected: 'initial-attribute-c-2-value',
			},
			{
				nodeDescription: '@d-attr-3 (attribute on element with initial value)',
				get node() {
					return dAttr3;
				},
				expected: '',
			},
		])('gets an element value - $nodeDescription', ({ node, expected }) => {
			const initialValue = createRoot(() => {
				const [modelValue] = createModelNodeSignal(node);

				return modelValue();
			});

			expect(initialValue).toBe(expected);
		});

		class ElementSetterCase<InitialValue extends string | undefined = undefined> {
			constructor(
				readonly tagName: string,
				readonly initialValue: InitialValue = undefined as InitialValue
			) {}

			get description(): string {
				const { initialValue } = this;

				if (initialValue == null) {
					return `<${this.tagName}>`;
				}

				return `<${this.tagName}> with initial value: ${JSON.stringify(initialValue)}`;
			}

			get element(): Element {
				const { initialValue, tagName } = this;
				const element = xformDocument.querySelector(tagName)!;

				if (initialValue != null) {
					element.textContent = initialValue;
				}

				return element;
			}
		}

		it.each([
			new ElementSetterCase('inner-a'),
			new ElementSetterCase('inner-b'),
			new ElementSetterCase('inner-c'),
			new ElementSetterCase('inner-d'),
		])('sets an element value - $description', ({ element }) => {
			const value = `setting value to ${performance.now()}`;

			const results = createRoot(() => {
				const [modelValue, setModelValue] = createModelNodeSignal(element);
				const setterValue = setModelValue(value);
				const getterValue = modelValue();
				const { textContent: domValue } = element;

				return { getterValue, setterValue, domValue };
			});

			expect(results.domValue).toBe(value);
			expect(results.getterValue).toBe(value);
			expect(results.setterValue).toBe(value);
		});

		it.each([
			new ElementSetterCase('inner-a', 'inner a with an initial value'),
			new ElementSetterCase('inner-b', 'another initial value'),
			new ElementSetterCase('inner-c', 'and again'),
			new ElementSetterCase('inner-d', 'this element has an attribute'),
		])(
			'sets an element value based on its previous value - $description',
			({ element, initialValue }) => {
				const expected = initialValue.toUpperCase();

				const results = createRoot(() => {
					const [modelValue, setModelValue] = createModelNodeSignal(element);
					const setterValue = setModelValue((currentValue) => currentValue.toUpperCase());
					const getterValue = modelValue();
					const { textContent: domValue } = element;

					return { getterValue, setterValue, domValue };
				});

				expect(results.domValue).toBe(expected);
				expect(results.getterValue).toBe(expected);
				expect(results.setterValue).toBe(expected);
			}
		);

		class AttributeSetterCase<InitialValue extends string | undefined = undefined> {
			constructor(
				readonly tagName: string,
				readonly attributeName: string,
				readonly initialValue: InitialValue = undefined as InitialValue
			) {}

			get description(): string {
				const { initialValue } = this;

				if (initialValue == null) {
					return `@${this.attributeName}`;
				}

				return `@${this.attributeName} with initial value: ${JSON.stringify(initialValue)}`;
			}

			get attribute(): Attr {
				const { attributeName, initialValue, tagName } = this;
				const element = xformDocument.querySelector(tagName)!;
				const attribute = element.getAttributeNode(attributeName)!;

				if (initialValue != null) {
					attribute.value = initialValue;
				}

				return attribute;
			}
		}

		it.each([
			new AttributeSetterCase('inner-c', 'c-attr-1'),
			new AttributeSetterCase('inner-c', 'c-attr-2'),
			new AttributeSetterCase('inner-d', 'd-attr-3'),
		])('sets an attribute value - $description', ({ attribute }) => {
			const value = `setting value to ${performance.now()}`;

			const results = createRoot(() => {
				const [modelValue, setModelValue] = createModelNodeSignal(attribute);
				const setterValue = setModelValue(value);
				const getterValue = modelValue();
				const { value: domValue } = attribute;

				return { getterValue, setterValue, domValue };
			});

			expect(results.domValue).toBe(value);
			expect(results.getterValue).toBe(value);
			expect(results.setterValue).toBe(value);
		});

		it.each([
			new AttributeSetterCase('inner-c', 'c-attr-1', 'initial c-attr-1 value'),
			new AttributeSetterCase('inner-c', 'c-attr-2', 'another initial attribute value'),
			new AttributeSetterCase('inner-d', 'd-attr-3', 'attribute on element with text value'),
		])(
			'sets an attribute value based on its previous value - $description',
			({ attribute, initialValue }) => {
				const expected = initialValue.toUpperCase();

				const results = createRoot(() => {
					const [modelValue, setModelValue] = createModelNodeSignal(attribute);
					const setterValue = setModelValue((currentValue) => currentValue.toUpperCase());
					const getterValue = modelValue();
					const { value: domValue } = attribute;

					return { getterValue, setterValue, domValue };
				});

				expect(results.domValue).toBe(expected);
				expect(results.getterValue).toBe(expected);
				expect(results.setterValue).toBe(expected);
			}
		);

		it('does not set the DOM or runtime state of a parent element', () => {
			const initialOuterElement = rootElement.cloneNode(true);
			const initialChildNodes = Array.from(initialOuterElement.childNodes);

			const results = createRoot(() => {
				const [modelValue, setModelValue] = createModelNodeSignal(rootElement);
				const setterValue = setModelValue((currentValue) => {
					expect(currentValue).toBe('');

					return 'not an empty string';
				});
				const getterValue = modelValue();

				return {
					getterValue,
					setterValue,
				};
			});

			expect(rootElement.isEqualNode(initialOuterElement)).toBe(true);
			expect(rootElement.childNodes.length).toBe(initialChildNodes.length);
			expect(
				initialChildNodes.every((initialChildNode, index) => {
					const childNode = rootElement.childNodes[index]!;

					return initialChildNode.isEqualNode(childNode);
				})
			).toBe(true);
			expect(results.getterValue).toBe('');
			expect(results.setterValue).toBe('');
		});
	});

	describe('calculate', () => {
		let innerABinding: XFormEntryBinding;
		let innerAElement: Element;
		let innerAX2Binding: XFormEntryBinding;
		let innerAX2Element: Element;
		let innerAX2CalculateExpression: string;

		// Chosen at random, assigned to `innerAElement.textContent`
		let aValue: number;
		let aDoubled: number;

		beforeEach(() => {
			innerABinding = xformEntry.get('/root/inner-a')!;
			innerAElement = innerABinding.getElement();
			innerAX2Binding = xformEntry.get('/root/inner-a-x2')!;
			innerAX2Element = innerAX2Binding.getElement();
			innerAX2CalculateExpression = innerAX2Binding.bind.calculate.expression!;

			aValue = Math.floor(Math.random() * 100);
			aDoubled = aValue * 2;

			innerAElement.textContent = String(aValue);
		});

		it('gets a calculated value', () => {
			const calculate = createCalculate(
				xformEntry.instanceDOM.primaryInstanceEvaluator,
				innerAX2Element,
				innerAX2CalculateExpression!
			);

			expect(calculate()).toBe(String(aDoubled));
		});

		it('assigns a calculated value to the DOM node', () => {
			const calculate = createCalculate(
				xformEntry.instanceDOM.primaryInstanceEvaluator,
				innerAX2Element,
				innerAX2CalculateExpression!
			);

			calculate();

			expect(innerAX2Element.textContent).toBe(String(aDoubled));
		});
	});
});

import {
	bind,
	body,
	head,
	html,
	input,
	mainInstance,
	model,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import { assert, beforeEach, describe, expect, expectTypeOf, it } from 'vitest';
import type { AnyNode, InputNode, ModelValueNode, RootNode, ValueType } from '../../src/index.ts';
import { initializeForm } from '../../src/index.ts';

describe('Value types', () => {
	describe('Model value nodes', () => {
		const modelNodeRelevanceExpression = "/root/model-node-relevance = 'yes'";
		// prettier-ignore
		const form = html(
			head(
				title('Model value types'),
				model(
					mainInstance(
						t(
							'root id="model-value-types"',
							t('model-node-relevance', 'yes'),
							t('string-value', 'explicit string'),
							t('implicit-string-value', 'implicit string'),
							t('int-value', '123'),
							t('decimal-value', '45.67'),
						)
					),
					bind('/root/string-value').type('string').relevant(modelNodeRelevanceExpression),
					bind('/root/implicit-string-value').relevant(modelNodeRelevanceExpression),
					bind('/root/int-value').type('int').relevant(modelNodeRelevanceExpression),
					bind('/root/decimal-value').type('decimal').relevant(modelNodeRelevanceExpression)
				)
			),
			body(
				input('/root/model-node-relevance')
			)
		).asXml();

		let root: RootNode;
		let explicitStringValueNode: ModelValueNode<'string'>;
		let implicitStringValueNode: ModelValueNode<'string'>;
		let intValueNode: ModelValueNode<'int'>;
		let decimalValueNode: ModelValueNode<'decimal'>;

		let setModelNodesNonRelevant: () => void;

		type AssertTypedModelValueNode = <V extends ValueType>(
			valueType: V,
			node?: AnyNode | ModelValueNode
		) => asserts node is ModelValueNode<V>;

		const assertTypedModelValueNode: AssertTypedModelValueNode = (valueType, node) => {
			assert(node);
			assert(node.nodeType === 'model-value', 'Expected model-value node');
			expect(node.valueType).toBe(valueType);
		};

		beforeEach(async () => {
			root = await initializeForm(form);

			const [modelNodeRelevance, explicitStringNode, implicitStringNode, intNode, decimalNode] =
				root.currentState.children;

			assert(modelNodeRelevance?.nodeType === 'input');

			setModelNodesNonRelevant = () => {
				modelNodeRelevance.setValue('no');
			};

			assertTypedModelValueNode('string', explicitStringNode);
			explicitStringValueNode = explicitStringNode;
			assertTypedModelValueNode('string', implicitStringNode);
			implicitStringValueNode = implicitStringNode;

			assertTypedModelValueNode('int', intNode);
			intValueNode = intNode;
			assertTypedModelValueNode('decimal', decimalNode);
			decimalValueNode = decimalNode;
		});

		describe('explicit type="string"', () => {
			it('has a string runtime value', () => {
				expect(typeof explicitStringValueNode.currentState.value).toBeTypeOf('string');
			});

			it('has a string static type', () => {
				expectTypeOf(explicitStringValueNode.currentState.value).toBeString();
			});

			it('has a string populated value', () => {
				expect(explicitStringValueNode.currentState.value).toBe('explicit string');
			});

			it('has an empty string blank value', () => {
				setModelNodesNonRelevant();
				expect(explicitStringValueNode.currentState.value).toBe('');
			});
		});

		describe('implicit string type (default)', () => {
			it('has a string runtime value', () => {
				expect(typeof implicitStringValueNode.currentState.value).toBeTypeOf('string');
			});

			it('has a string static type', () => {
				expectTypeOf(implicitStringValueNode.currentState.value).toBeString();
			});

			it('has a string populated value', () => {
				expect(implicitStringValueNode.currentState.value).toBe('implicit string');
			});

			it('has an empty string blank value', () => {
				setModelNodesNonRelevant();
				expect(implicitStringValueNode.currentState.value).toBe('');
			});
		});

		describe('type="int"', () => {
			it('has a bigint runtime value', () => {
				expect(intValueNode.currentState.value).toBeTypeOf('bigint');
			});

			it('has a bigint | null static type', () => {
				expectTypeOf(intValueNode.currentState.value).toEqualTypeOf<bigint | null>();
			});

			it('has a bigint populated value', () => {
				expect(intValueNode.currentState.value).toBe(123n);
			});

			it('has a null blank value', () => {
				setModelNodesNonRelevant();
				expect(intValueNode.currentState.value).toBe(null);
			});
		});

		describe('type="decimal"', () => {
			it('has a number runtime value', () => {
				expect(decimalValueNode.currentState.value).toBeTypeOf('number');
			});

			it('has a number | null static type', () => {
				expectTypeOf(decimalValueNode.currentState.value).toEqualTypeOf<number | null>();
			});

			it('has a number populated value', () => {
				expect(decimalValueNode.currentState.value).toBe(45.67);
			});

			it('has a null blank value', () => {
				setModelNodesNonRelevant();
				expect(decimalValueNode.currentState.value).toBe(null);
			});
		});
	});

	describe('Input nodes', () => {
		const inputRelevanceExpression = "/root/input-relevance = 'yes'";
		// prettier-ignore
		const form = html(
			head(
				title('Input types'),
				model(
					mainInstance(
						t(
							'root id="input-types"',
							t('input-relevance', 'yes'),
							t('string-value', 'explicit string'),
							t('implicit-string-value', 'implicit string'),
							t('int-value', '123'),
							t('decimal-value', '45.67'),
						)
					),
					bind('/root/string-value').type('string').relevant(inputRelevanceExpression),
					bind('/root/implicit-string-value').relevant(inputRelevanceExpression),
					bind('/root/int-value').type('int').relevant(inputRelevanceExpression),
					bind('/root/decimal-value').type('decimal').relevant(inputRelevanceExpression)
				)
			),
			body(
				input('/root/input-relevance'),
				input('/root/string-value'),
				input('/root/implicit-string-value'),
				input('/root/int-value'),
				input('/root/decimal-value'),
			)
		).asXml();

		let root: RootNode;
		let explicitStringValueNode: InputNode<'string'>;
		let implicitStringValueNode: InputNode<'string'>;
		let intValueNode: InputNode<'int'>;
		let decimalValueNode: InputNode<'decimal'>;

		let setTypedInputNodesNonRelevant: () => void;

		type AssertTypedInputNode = <V extends ValueType>(
			valueType: V,
			node?: AnyNode | InputNode
		) => asserts node is InputNode<V>;

		const assertTypedInputNode: AssertTypedInputNode = (valueType, node) => {
			assert(node);
			assert(node.nodeType === 'input', 'Expected input node');
			expect(node.valueType).toBe(valueType);
		};

		beforeEach(async () => {
			root = await initializeForm(form);

			const [
				typedInputNodeRelevance,
				explicitStringNode,
				implicitStringNode,
				intNode,
				decimalNode,
			] = root.currentState.children;

			assert(typedInputNodeRelevance?.nodeType === 'input');

			setTypedInputNodesNonRelevant = () => {
				typedInputNodeRelevance.setValue('no');
			};

			assertTypedInputNode('string', explicitStringNode);
			explicitStringValueNode = explicitStringNode;
			assertTypedInputNode('string', implicitStringNode);
			implicitStringValueNode = implicitStringNode;

			assertTypedInputNode('int', intNode);
			intValueNode = intNode;
			assertTypedInputNode('decimal', decimalNode);
			decimalValueNode = decimalNode;
		});

		describe('explicit type="string"', () => {
			it('has a string runtime value', () => {
				expect(typeof explicitStringValueNode.currentState.value).toBeTypeOf('string');
			});

			it('has a string static type', () => {
				expectTypeOf(explicitStringValueNode.currentState.value).toBeString();
			});

			it('has a string populated value', () => {
				expect(explicitStringValueNode.currentState.value).toBe('explicit string');
			});

			it('has an empty string blank value', () => {
				setTypedInputNodesNonRelevant();
				expect(explicitStringValueNode.currentState.value).toBe('');
			});

			it('sets a string value', () => {
				explicitStringValueNode.setValue('updated string');
				expect(explicitStringValueNode.currentState.value).toBe('updated string');
			});
		});

		describe('implicit string type (default)', () => {
			it('has a string runtime value', () => {
				expect(typeof implicitStringValueNode.currentState.value).toBeTypeOf('string');
			});

			it('has a string static type', () => {
				expectTypeOf(implicitStringValueNode.currentState.value).toBeString();
			});

			it('has a string populated value', () => {
				expect(implicitStringValueNode.currentState.value).toBe('implicit string');
			});

			it('has an empty string blank value', () => {
				setTypedInputNodesNonRelevant();
				expect(implicitStringValueNode.currentState.value).toBe('');
			});

			it('sets a string value', () => {
				implicitStringValueNode.setValue('updated string');
				expect(implicitStringValueNode.currentState.value).toBe('updated string');
			});
		});

		describe('type="int"', () => {
			it('has a bigint runtime value', () => {
				expect(intValueNode.currentState.value).toBeTypeOf('bigint');
			});

			it('has a bigint | null static type', () => {
				expectTypeOf(intValueNode.currentState.value).toEqualTypeOf<bigint | null>();
			});

			it('has a bigint populated value', () => {
				expect(intValueNode.currentState.value).toBe(123n);
			});

			it('has a null blank value', () => {
				setTypedInputNodesNonRelevant();
				expect(intValueNode.currentState.value).toBe(null);
			});

			describe('setting int values', () => {
				interface SetIntInputValueByType {
					readonly bigint: bigint;
					readonly number: number;
					readonly string: string;
					readonly null: null;
				}

				type SetIntInputValueType = keyof SetIntInputValueByType;

				interface BaseSetIntInputValueCase<T extends SetIntInputValueType> {
					readonly inputType: T;
					readonly inputValue: SetIntInputValueByType[T];
					readonly expectedValue: bigint | null;
				}

				type SetIntInputValueCase = {
					[T in SetIntInputValueType]: BaseSetIntInputValueCase<T>;
				}[SetIntInputValueType];

				describe.each<SetIntInputValueCase>([
					{ inputType: 'bigint', inputValue: 89n, expectedValue: 89n },
					{ inputType: 'number', inputValue: 10, expectedValue: 10n },
					{ inputType: 'string', inputValue: '23', expectedValue: 23n },
					{ inputType: 'null', inputValue: null, expectedValue: null },
					{ inputType: 'string', inputValue: '10.1', expectedValue: 10n },
					{ inputType: 'number', inputValue: 10.1, expectedValue: 10n },
				])('setValue($inputType)', ({ inputValue, expectedValue }) => {
					it(`sets ${inputValue}, resulting in value ${expectedValue}`, () => {
						intValueNode.setValue(inputValue);

						expectTypeOf(intValueNode.currentState.value).toEqualTypeOf<bigint | null>();

						if (expectedValue == null) {
							expect(intValueNode.currentState.value).toBeNull();
							expect(intValueNode.currentState.instanceValue).toBe('');
						} else {
							expect(intValueNode.currentState.value).toBeTypeOf('bigint');
							expect(intValueNode.currentState.value).toBe(expectedValue);
							expect(intValueNode.currentState.instanceValue).toBe(`${expectedValue}`);
						}
					});
				});

				interface BaseSetIntInputErrorCase<T extends SetIntInputValueType> {
					readonly inputType: T;
					readonly inputValue: SetIntInputValueByType[T];
				}

				type SetIntInputErrorCase = {
					[T in SetIntInputValueType]: BaseSetIntInputErrorCase<T>;
				}[SetIntInputValueType];

				describe.each<SetIntInputErrorCase>([
					{ inputType: 'bigint', inputValue: -2_147_483_649n },
					{ inputType: 'bigint', inputValue: 2_147_483_648n },
					{ inputType: 'number', inputValue: -2_147_483_649 },
					{ inputType: 'number', inputValue: 2_147_483_648 },
					{ inputType: 'string', inputValue: '-2147483649' },
					{ inputType: 'string', inputValue: '2147483648' },
				])('integer value out of specified bounds ($inputType)', ({ inputValue }) => {
					it(`fails to set ${inputValue}`, () => {
						let caught: unknown;

						try {
							intValueNode.setValue(inputValue);
						} catch (error) {
							caught = error;
						}

						expect(caught, `Value was set to ${intValueNode.currentState.value}`).toBeInstanceOf(
							Error
						);
					});
				});
			});
		});

		describe('type="decimal"', () => {
			it('has a number runtime value', () => {
				expect(decimalValueNode.currentState.value).toBeTypeOf('number');
			});

			it('has a number | null static type', () => {
				expectTypeOf(decimalValueNode.currentState.value).toEqualTypeOf<number | null>();
			});

			it('has a number populated value', () => {
				expect(decimalValueNode.currentState.value).toBe(45.67);
			});

			it('has a null blank value', () => {
				setTypedInputNodesNonRelevant();
				expect(decimalValueNode.currentState.value).toBe(null);
			});

			describe('setting decimal values', () => {
				interface SetDecimalInputValueByType {
					readonly bigint: bigint;
					readonly number: number;
					readonly string: string;
					readonly null: null;
				}

				type SetDecimalInputValueType = keyof SetDecimalInputValueByType;

				interface BaseSetDecimalInputValueCase<T extends SetDecimalInputValueType> {
					readonly inputType: T;
					readonly inputValue: SetDecimalInputValueByType[T];
					readonly expectedValue: number | null;
				}

				type SetDecimalInputValueCase = {
					[T in SetDecimalInputValueType]: BaseSetDecimalInputValueCase<T>;
				}[SetDecimalInputValueType];

				it.each<SetDecimalInputValueCase>([
					{ inputType: 'bigint', inputValue: 89n, expectedValue: 89 },
					{ inputType: 'number', inputValue: 10, expectedValue: 10 },
					{ inputType: 'string', inputValue: '23', expectedValue: 23 },
					{ inputType: 'null', inputValue: null, expectedValue: null },
				])('sets value ($inputType)', ({ inputValue, expectedValue }) => {
					decimalValueNode.setValue(inputValue);

					expectTypeOf(decimalValueNode.currentState.value).toEqualTypeOf<number | null>();

					if (expectedValue == null) {
						expect(decimalValueNode.currentState.value).toBeNull();
						expect(decimalValueNode.currentState.instanceValue).toBe('');
					} else {
						expect(decimalValueNode.currentState.value).toBeTypeOf('number');
						expect(decimalValueNode.currentState.value).toBe(expectedValue);
						expect(decimalValueNode.currentState.instanceValue).toBe(`${expectedValue}`);
					}
				});
			});
		});
	});
});

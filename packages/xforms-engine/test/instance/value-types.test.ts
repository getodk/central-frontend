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
import type { AnyNode, ModelValueNode, RootNode, ValueType } from '../../src/index.ts';
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

			assert(modelNodeRelevance?.nodeType === 'string');

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
});

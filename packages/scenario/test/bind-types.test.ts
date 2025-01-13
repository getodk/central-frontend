import {
	bind,
	body,
	head,
	html,
	input,
	instance,
	item,
	mainInstance,
	model,
	repeat,
	select1,
	select1Dynamic,
	selectDynamic,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import type { ValueType } from '@getodk/xforms-engine';
import { assert, beforeEach, describe, expect, expectTypeOf, it } from 'vitest';
import { intAnswer } from '../src/answer/ExpectedIntAnswer.ts';
import { InputNodeAnswer } from '../src/answer/InputNodeAnswer.ts';
import { ModelValueNodeAnswer } from '../src/answer/ModelValueNodeAnswer.ts.ts';
import { SelectNodeAnswer } from '../src/answer/SelectNodeAnswer.ts';
import type { ValueNodeAnswer } from '../src/answer/ValueNodeAnswer.ts';
import { Scenario } from '../src/jr/Scenario.ts';

describe('Data (<bind type>) type support', () => {
	describe('model-only values', () => {
		const formTitle = 'Model value types';
		const modelNodeRelevancePath = '/root/model-node-relevance';
		const modelNodeRelevanceExpression = `${modelNodeRelevancePath} = 'yes'`;

		// prettier-ignore
		const formDefinition = html(
			head(
				title(formTitle),
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
				input('/root/model-node-relevance'))
		);

		type AssertTypedModelValueNodeAnswer = <V extends ValueType>(
			answer: ValueNodeAnswer,
			valueType: V
		) => asserts answer is ModelValueNodeAnswer<V>;

		const assertTypedModelValueNodeAnswer: AssertTypedModelValueNodeAnswer = (
			answer,
			valueType
		) => {
			assert(answer instanceof ModelValueNodeAnswer);
			assert(answer.valueType === valueType);
		};

		const getTypedModelValueNodeAnswer = <V extends ValueType>(
			reference: string,
			valueType: V
		): ModelValueNodeAnswer<V> => {
			const answer = scenario.answerOf(reference);

			assertTypedModelValueNodeAnswer(answer, valueType);

			return answer;
		};

		let scenario: Scenario;

		beforeEach(async () => {
			scenario = await Scenario.init(formTitle, formDefinition);
		});

		describe('explicit type="string"', () => {
			let answer: ModelValueNodeAnswer<'string'>;

			beforeEach(() => {
				answer = getTypedModelValueNodeAnswer('/root/string-value', 'string');
			});

			it('has a string runtime value', () => {
				expect(answer.value).toBeTypeOf('string');
			});

			it('has a string static type', () => {
				expectTypeOf(answer.value).toBeString();
			});

			it('has a string populated value', () => {
				expect(answer.value).toBe('explicit string');
			});

			it('has an empty string blank value', () => {
				scenario.answer(modelNodeRelevancePath, 'no');
				answer = getTypedModelValueNodeAnswer('/root/string-value', 'string');
				expect(answer.value).toBe('');
			});
		});

		describe('implicit string type (default)', () => {
			let answer: ModelValueNodeAnswer<'string'>;

			beforeEach(() => {
				answer = getTypedModelValueNodeAnswer('/root/implicit-string-value', 'string');
			});

			it('has a string runtime value', () => {
				expect(answer.value).toBeTypeOf('string');
			});

			it('has a string static type', () => {
				expectTypeOf(answer.value).toBeString();
			});

			it('has a string populated value', () => {
				expect(answer.value).toBe('implicit string');
			});

			it('has an empty string blank value', () => {
				scenario.answer(modelNodeRelevancePath, 'no');
				answer = getTypedModelValueNodeAnswer('/root/implicit-string-value', 'string');
				expect(answer.value).toBe('');
			});
		});

		describe('type="int"', () => {
			let answer: ModelValueNodeAnswer<'int'>;

			beforeEach(() => {
				answer = getTypedModelValueNodeAnswer('/root/int-value', 'int');
			});

			it('has a bigint runtime value', () => {
				expect(answer.value).toBeTypeOf('bigint');
			});

			it('has a bigint | null static type', () => {
				expectTypeOf(answer.value).toEqualTypeOf<bigint | null>();
			});

			it('has a bigint populated value', () => {
				expect(answer.value).toBe(123n);
			});

			it('has a null blank value', () => {
				scenario.answer(modelNodeRelevancePath, 'no');
				answer = getTypedModelValueNodeAnswer('/root/int-value', 'int');
				expect(answer.value).toBe(null);
			});
		});

		describe('type="decimal"', () => {
			let answer: ModelValueNodeAnswer<'decimal'>;

			beforeEach(() => {
				answer = getTypedModelValueNodeAnswer('/root/decimal-value', 'decimal');
			});

			it('has a number runtime value', () => {
				expect(answer.value).toBeTypeOf('number');
			});

			it('has a number | null static type', () => {
				expectTypeOf(answer.value).toEqualTypeOf<number | null>();
			});

			it('has a number populated value', () => {
				expect(answer.value).toBe(45.67);
			});

			it('has a null blank value', () => {
				scenario.answer(modelNodeRelevancePath, 'no');
				answer = getTypedModelValueNodeAnswer('/root/decimal-value', 'decimal');
				expect(answer.value).toBe(null);
			});
		});
	});

	describe('inputs', () => {
		const formTitle = 'Input types';
		const inputRelevancePath = '/root/input-relevance';
		const inputRelevanceExpression = `${inputRelevancePath} = 'yes'`;

		// prettier-ignore
		const formDefinition = html(
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
		);

		let scenario: Scenario;

		type AssertTypedInputNodeAnswer = <V extends ValueType>(
			answer: ValueNodeAnswer,
			valueType: V
		) => asserts answer is InputNodeAnswer<V>;

		const assertTypedInputNodeAnswer: AssertTypedInputNodeAnswer = (answer, valueType) => {
			assert(answer instanceof InputNodeAnswer);
			assert(answer.valueType === valueType);
		};

		const getTypedInputNodeAnswer = <V extends ValueType>(
			reference: string,
			valueType: V
		): InputNodeAnswer<V> => {
			const answer = scenario.answerOf(reference);

			assertTypedInputNodeAnswer(answer, valueType);

			return answer;
		};

		beforeEach(async () => {
			scenario = await Scenario.init(formTitle, formDefinition);
		});

		describe('explicit type="string"', () => {
			let answer: InputNodeAnswer<'string'>;

			beforeEach(() => {
				answer = getTypedInputNodeAnswer('/root/string-value', 'string');
			});

			it('has a string runtime value', () => {
				expect(answer.value).toBeTypeOf('string');
			});

			it('has a string static type', () => {
				expectTypeOf(answer.value).toBeString();
			});

			it('has a string populated value', () => {
				expect(answer.value).toBe('explicit string');
			});

			it('has an empty string blank value', () => {
				scenario.answer(inputRelevancePath, 'no');
				answer = getTypedInputNodeAnswer('/root/string-value', 'string');
				expect(answer.value).toBe('');
			});

			it('sets a string value', () => {
				scenario.answer('/root/string-value', 'updated string');
				answer = getTypedInputNodeAnswer('/root/string-value', 'string');
				expect(answer.value).toBe('updated string');
			});
		});

		describe('implicit string type (default)', () => {
			let answer: InputNodeAnswer<'string'>;

			beforeEach(() => {
				answer = getTypedInputNodeAnswer('/root/implicit-string-value', 'string');
			});

			it('has a string runtime value', () => {
				expect(answer.value).toBeTypeOf('string');
			});

			it('has a string static type', () => {
				expectTypeOf(answer.value).toBeString();
			});

			it('has a string populated value', () => {
				expect(answer.value).toBe('implicit string');
			});

			it('has an empty string blank value', () => {
				scenario.answer(inputRelevancePath, 'no');
				answer = getTypedInputNodeAnswer('/root/implicit-string-value', 'string');
				expect(answer.value).toBe('');
			});

			it('sets a string value', () => {
				scenario.answer('/root/implicit-string-value', 'updated string');
				answer = getTypedInputNodeAnswer('/root/implicit-string-value', 'string');
				expect(answer.value).toBe('updated string');
			});
		});

		describe('type="int"', () => {
			let answer: InputNodeAnswer<'int'>;

			beforeEach(() => {
				answer = getTypedInputNodeAnswer('/root/int-value', 'int');
			});

			it('has a bigint runtime value', () => {
				expect(answer.value).toBeTypeOf('bigint');
			});

			it('has a bigint | null static type', () => {
				expectTypeOf(answer.value).toEqualTypeOf<bigint | null>();
			});

			it('has a bigint populated value', () => {
				expect(answer.value).toBe(123n);
			});

			it('has a null blank value', () => {
				scenario.answer(inputRelevancePath, 'no');
				answer = getTypedInputNodeAnswer('/root/int-value', 'int');
				expect(answer.value).toBe(null);
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
						scenario.answer('/root/int-value', inputValue);
						answer = getTypedInputNodeAnswer('/root/int-value', 'int');

						expectTypeOf(answer.value).toEqualTypeOf<bigint | null>();

						if (expectedValue == null) {
							expect(answer.value).toBeNull();
							expect(answer.stringValue).toBe('');
						} else {
							expect(answer.value).toBeTypeOf('bigint');
							expect(answer.value).toBe(expectedValue);
							expect(answer.stringValue).toBe(`${expectedValue}`);
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
							scenario.answer('/root/int-value', inputValue);
							answer = getTypedInputNodeAnswer('/root/int-value', 'int');
						} catch (error) {
							caught = error;
						}

						expect(caught, `Value was set to ${answer.value}`).toBeInstanceOf(Error);
					});
				});
			});
		});

		describe('type="decimal"', () => {
			let answer: InputNodeAnswer<'decimal'>;

			beforeEach(() => {
				answer = getTypedInputNodeAnswer('/root/decimal-value', 'decimal');
			});

			it('has a number runtime value', () => {
				expect(answer.value).toBeTypeOf('number');
			});

			it('has a number | null static type', () => {
				expectTypeOf(answer.value).toEqualTypeOf<number | null>();
			});

			it('has a number populated value', () => {
				expect(answer.value).toBe(45.67);
			});

			it('has a null blank value', () => {
				scenario.answer(inputRelevancePath, 'no');
				answer = getTypedInputNodeAnswer('/root/decimal-value', 'decimal');
				expect(answer.value).toBe(null);
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
					scenario.answer('/root/decimal-value', inputValue);
					answer = getTypedInputNodeAnswer('/root/decimal-value', 'decimal');

					expectTypeOf(answer.value).toEqualTypeOf<number | null>();

					if (expectedValue == null) {
						expect(answer.value).toBeNull();
						expect(answer.stringValue).toBe('');
					} else {
						expect(answer.value).toBeTypeOf('number');
						expect(answer.value).toBe(expectedValue);
						expect(answer.stringValue).toBe(`${expectedValue}`);
					}
				});
			});
		});
	});

	type Select1StringValueWordSeparatorChar = ' ' | '-';

	interface Select1StringValueCase {
		readonly stringValueWordSeparator: Select1StringValueWordSeparatorChar;
	}

	describe.each<Select1StringValueCase>([
		{ stringValueWordSeparator: '-' },
		{ stringValueWordSeparator: ' ' },
	])(
		'select1 (string value word separator: "$stringValueWordSeparator")',
		({ stringValueWordSeparator }) => {
			const formTitle = 'Select (1) types';
			const selectRelevancePath = '/root/select-relevance';
			const selectRelevanceExpression = `${selectRelevancePath} = 'yes'`;
			const select1StringValue = (baseValue: string): string => {
				return baseValue.replaceAll(' ', stringValueWordSeparator);
			};

			// prettier-ignore
			const formDefinition = html(
				head(
					title(formTitle),
					model(
						mainInstance(
							t(
								'root id="select-types"',
								t('select-relevance', 'yes'),
								t('string-value', select1StringValue('explicit string')),
								t('implicit-string-value', select1StringValue('implicit string')),
								t('int-value', '123'),
								t('decimal-value', '45.67'),
							)
						),
						instance('strings',
							t('item',
								t('value', select1StringValue('implicit string')),
								t('label', 'Implicit String')),
							t('item',
								t('value', select1StringValue('explicit string')),
								t('label', 'Explicit String')),
							t('item',
								t('value', select1StringValue('updated string')),
								t('label', 'Updated String'))
						),
						instance('ints',
							t('item',
								t('value', '123'),
								t('label', '123')),
							t('item',
								t('value', '10'),
								t('label', '10')),
							t('item',
								t('value', '23'),
								t('label', '23')),
							t('item',
								t('value', '89'),
								t('label', '89'))
						),
						instance('decimals',
							t('item',
								t('value', '45.67'),
								t('label', '45.67')),
							t('item',
								t('value', '89'),
								t('label', '89')),
							t('item',
								t('value', '10'),
								t('label', '10')),
							t('item',
								t('value', '23.4'),
								t('label', '23.4')),
						),
						bind('/root/string-value').type('string').relevant(selectRelevanceExpression),
						bind('/root/implicit-string-value').relevant(selectRelevanceExpression),
						bind('/root/int-value').type('int').relevant(selectRelevanceExpression),
						bind('/root/decimal-value').type('decimal').relevant(selectRelevanceExpression)
					)
				),
				body(
					select1('/root/select-relevance',
						item('yes', 'Yes'),
						item('no', 'No')
					),
					select1Dynamic('/root/string-value', "instance('strings')/root/item"),
					select1Dynamic('/root/implicit-string-value', "instance('strings')/root/item"),
					select1Dynamic('/root/int-value', "instance('ints')/root/item"),
					select1Dynamic('/root/decimal-value', "instance('decimals')/root/item"),
				)
			);

			let scenario: Scenario;

			type AssertTypedSelectNodeAnswer = <V extends ValueType>(
				answer: ValueNodeAnswer,
				valueType: V
			) => asserts answer is SelectNodeAnswer<V>;

			const assertTypedSelectNodeAnswer: AssertTypedSelectNodeAnswer = (answer, valueType) => {
				assert(answer instanceof SelectNodeAnswer);
				assert(answer.valueType === valueType);
			};

			const getTypedSelectNodeAnswer = <V extends ValueType>(
				reference: string,
				valueType: V
			): SelectNodeAnswer<V> => {
				const answer = scenario.answerOf(reference);

				assertTypedSelectNodeAnswer(answer, valueType);

				return answer;
			};

			beforeEach(async () => {
				scenario = await Scenario.init(formTitle, formDefinition);
			});

			describe('explicit type="string"', () => {
				let answer: SelectNodeAnswer<'string'>;

				beforeEach(() => {
					answer = getTypedSelectNodeAnswer('/root/string-value', 'string');
				});

				it('has a runtime value which is an array of a single string value', () => {
					expect(answer.value).toBeInstanceOf(Array);
					expect(answer.value.length).toBe(1);
					expect(answer.value[0]).toBeTypeOf('string');
				});

				it('has a readonly string[] static type', () => {
					expectTypeOf(answer.value).toMatchTypeOf<readonly string[]>();
				});

				it('has a string value populated as an array item', () => {
					expect(answer.value).toEqual([select1StringValue('explicit string')]);
				});

				it('has an empty array blank value', () => {
					scenario.answer(selectRelevancePath, 'no');
					answer = getTypedSelectNodeAnswer('/root/string-value', 'string');
					expect(answer.value).toEqual([]);
				});

				it('sets a string value', () => {
					const value = select1StringValue('updated string');

					scenario.answer('/root/string-value', value);
					answer = getTypedSelectNodeAnswer('/root/string-value', 'string');
					expect(answer.value).toEqual([value]);
				});
			});

			describe('implicit string type (default)', () => {
				let answer: SelectNodeAnswer<'string'>;

				beforeEach(() => {
					answer = getTypedSelectNodeAnswer('/root/implicit-string-value', 'string');
				});

				it('has a runtime value which is an array of a single string value', () => {
					expect(answer.value).toBeInstanceOf(Array);
					expect(answer.value.length).toBe(1);
					expect(answer.value[0]).toBeTypeOf('string');
				});

				it('has a readonly string[] static type', () => {
					expectTypeOf(answer.value).toMatchTypeOf<readonly string[]>();
				});

				it('has a string value populated as an array item', () => {
					expect(answer.value).toEqual([select1StringValue('implicit string')]);
				});

				it('has an empty string blank value', () => {
					scenario.answer(selectRelevancePath, 'no');
					answer = getTypedSelectNodeAnswer('/root/implicit-string-value', 'string');
					expect(answer.value).toEqual([]);
				});

				it('sets a string value', () => {
					const value = select1StringValue('updated string');

					scenario.answer('/root/implicit-string-value', value);
					answer = getTypedSelectNodeAnswer('/root/implicit-string-value', 'string');
					expect(answer.value).toEqual([value]);
				});
			});

			describe('type="int"', () => {
				let answer: SelectNodeAnswer<'int'>;

				beforeEach(() => {
					answer = getTypedSelectNodeAnswer('/root/int-value', 'int');
				});

				it('has a runtime value which is an array of a single bigint value', () => {
					expect(answer.value).toBeInstanceOf(Array);
					expect(answer.value.length).toBe(1);
					expect(answer.value[0]).toBeTypeOf('bigint');
				});

				it('has a readonly bigint[] static type', () => {
					expectTypeOf(answer.value).toEqualTypeOf<readonly bigint[]>();
				});

				it('has a bigint value populated as an array item', () => {
					expect(answer.value).toEqual([123n]);
				});

				it('has an empty array blank value', () => {
					scenario.answer(selectRelevancePath, 'no');
					answer = getTypedSelectNodeAnswer('/root/int-value', 'int');
					expect(answer.value).toEqual([]);
				});

				describe('setting int values', () => {
					interface SetIntSelectValueCase {
						readonly selectValue: bigint | null;
						readonly expectedValue: readonly [] | readonly [bigint];
					}

					describe.each<SetIntSelectValueCase>([
						{ selectValue: 89n, expectedValue: [89n] },
						{ selectValue: 10n, expectedValue: [10n] },
						{ selectValue: 23n, expectedValue: [23n] },
						{ selectValue: null, expectedValue: [] },
					])('setValue($selectType)', ({ selectValue, expectedValue }) => {
						const expectedValueDescription = JSON.stringify(expectedValue.map(String));

						it(`sets ${selectValue}, resulting in value ${expectedValueDescription}`, () => {
							scenario.answer('/root/int-value', selectValue);
							answer = getTypedSelectNodeAnswer('/root/int-value', 'int');

							expectTypeOf(answer.value).toEqualTypeOf<readonly bigint[]>();

							expect(answer.value).toEqual(expectedValue);

							const expectedValueItem = expectedValue[0] ?? '';
							const expectedStringValue = String(expectedValueItem);

							expect(answer.stringValue).toBe(expectedStringValue);
						});
					});

					interface SetIntSelectErrorCase {
						readonly selectValue: bigint | null;
					}

					describe.each<SetIntSelectErrorCase>([
						{ selectValue: -2_147_483_649n },
						{ selectValue: 2_147_483_648n },
					])('integer value out of specified bounds ($selectType)', ({ selectValue }) => {
						it(`fails to set ${selectValue}`, () => {
							let caught: unknown;

							try {
								scenario.answer('/root/int-value', selectValue);
								answer = getTypedSelectNodeAnswer('/root/int-value', 'int');
							} catch (error) {
								caught = error;
							}

							expect(caught, `Value was set to ${answer.stringValue}`).toBeInstanceOf(Error);
						});
					});
				});
			});

			describe('type="decimal"', () => {
				let answer: SelectNodeAnswer<'decimal'>;

				beforeEach(() => {
					answer = getTypedSelectNodeAnswer('/root/decimal-value', 'decimal');
				});

				it('has a runtime value which is an array of a single number value', () => {
					expect(answer.value).toBeInstanceOf(Array);
					expect(answer.value.length).toBe(1);
					expect(answer.value[0]).toBeTypeOf('number');
				});

				it('has a readonly number[] static type', () => {
					expectTypeOf(answer.value).toEqualTypeOf<readonly number[]>();
				});

				it('has a number populated value', () => {
					expect(answer.value).toEqual([45.67]);
				});

				it('has an empty array blank value', () => {
					scenario.answer(selectRelevancePath, 'no');
					answer = getTypedSelectNodeAnswer('/root/decimal-value', 'decimal');
					expect(answer.value).toEqual([]);
				});

				describe('setting decimal values', () => {
					interface SetDecimalSelectValueCase {
						readonly selectValue: number | null;
						readonly expectedValue: readonly [] | readonly [number];
					}

					it.each<SetDecimalSelectValueCase>([
						{ selectValue: 89, expectedValue: [89] },
						{ selectValue: 10, expectedValue: [10] },
						{ selectValue: 23.4, expectedValue: [23.4] },
						{ selectValue: null, expectedValue: [] },
					])(
						'sets value $selectValue, resulting in $expectedValue',
						({ selectValue, expectedValue }) => {
							scenario.answer('/root/decimal-value', selectValue);
							answer = getTypedSelectNodeAnswer('/root/decimal-value', 'decimal');

							expectTypeOf(answer.value).toEqualTypeOf<readonly number[]>();

							expect(answer.value).toEqual(expectedValue);

							const expectedValueItem = expectedValue[0] ?? '';
							const expectedStringValue = String(expectedValueItem);

							expect(answer.stringValue).toBe(expectedStringValue);
						}
					);
				});
			});
		}
	);

	describe('select (multiple)', () => {
		const formTitle = 'Select (multiple) types';
		const selectRelevancePath = '/root/select-relevance';
		const selectRelevanceExpression = `${selectRelevancePath} = 'yes'`;

		// prettier-ignore
		const formDefinition = html(
			head(
				title(formTitle),
				model(
					mainInstance(
						t(
							'root id="select-types"',
							t('select-relevance', 'yes'),
							t('string-value', 'explicit-string'),
							t('implicit-string-value', 'implicit-string'),
							t('int-value', '123'),
							t('decimal-value', '45.67'),
						)
					),
					instance('strings',
						t('item',
							t('value', 'implicit-string'),
							t('label', 'Implicit String')),
						t('item',
							t('value', 'explicit-string'),
							t('label', 'Explicit String')),
						t('item',
							t('value', 'updated-string'),
							t('label', 'Updated String'))
					),
					instance('ints',
						t('item',
							t('value', '123'),
							t('label', '123')),
						t('item',
							t('value', '10'),
							t('label', '10')),
						t('item',
							t('value', '23'),
							t('label', '23')),
						t('item',
							t('value', '89'),
							t('label', '89'))
					),
					instance('decimals',
						t('item',
							t('value', '45.67'),
							t('label', '45.67')),
						t('item',
							t('value', '89'),
							t('label', '89')),
						t('item',
							t('value', '10'),
							t('label', '10')),
						t('item',
							t('value', '23.4'),
							t('label', '23.4')),
					),
					bind('/root/string-value').type('string').relevant(selectRelevanceExpression),
					bind('/root/implicit-string-value').relevant(selectRelevanceExpression),
					bind('/root/int-value').type('int').relevant(selectRelevanceExpression),
					bind('/root/decimal-value').type('decimal').relevant(selectRelevanceExpression)
				)
			),
			body(
				select1('/root/select-relevance',
					item('yes', 'Yes'),
					item('no', 'No')
				),
				selectDynamic('/root/string-value', "instance('strings')/root/item"),
				selectDynamic('/root/implicit-string-value', "instance('strings')/root/item"),
				selectDynamic('/root/int-value', "instance('ints')/root/item"),
				selectDynamic('/root/decimal-value', "instance('decimals')/root/item"),
			)
		);

		let scenario: Scenario;

		type AssertTypedSelectNodeAnswer = <V extends ValueType>(
			answer: ValueNodeAnswer,
			valueType: V
		) => asserts answer is SelectNodeAnswer<V>;

		const assertTypedSelectNodeAnswer: AssertTypedSelectNodeAnswer = (answer, valueType) => {
			assert(answer instanceof SelectNodeAnswer);
			assert(answer.valueType === valueType);
		};

		const getTypedSelectNodeAnswer = <V extends ValueType>(
			reference: string,
			valueType: V
		): SelectNodeAnswer<V> => {
			const answer = scenario.answerOf(reference);

			assertTypedSelectNodeAnswer(answer, valueType);

			return answer;
		};

		beforeEach(async () => {
			scenario = await Scenario.init(formTitle, formDefinition);
		});

		describe('explicit type="string"', () => {
			let answer: SelectNodeAnswer<'string'>;

			beforeEach(() => {
				answer = getTypedSelectNodeAnswer('/root/string-value', 'string');
			});

			it('has a runtime value which is an array of a single string value', () => {
				expect(answer.value).toBeInstanceOf(Array);
				expect(answer.value.length).toBe(1);
				expect(answer.value[0]).toBeTypeOf('string');
			});

			it('has a readonly string[] static type', () => {
				expectTypeOf(answer.value).toMatchTypeOf<readonly string[]>();
			});

			it('has a string value populated as an array item', () => {
				expect(answer.value).toEqual(['explicit-string']);
			});

			it('has an empty array blank value', () => {
				scenario.answer(selectRelevancePath, 'no');
				answer = getTypedSelectNodeAnswer('/root/string-value', 'string');
				expect(answer.value).toEqual([]);
			});

			it('sets string values', () => {
				scenario.answer('/root/string-value', 'explicit-string', 'updated-string');
				answer = getTypedSelectNodeAnswer('/root/string-value', 'string');
				expect(answer.value).toEqual(['explicit-string', 'updated-string']);
			});
		});

		describe('implicit string type (default)', () => {
			let answer: SelectNodeAnswer<'string'>;

			beforeEach(() => {
				answer = getTypedSelectNodeAnswer('/root/implicit-string-value', 'string');
			});

			it('has a runtime value which is an array of a single string value', () => {
				expect(answer.value).toBeInstanceOf(Array);
				expect(answer.value.length).toBe(1);
				expect(answer.value[0]).toBeTypeOf('string');
			});

			it('has a readonly string[] static type', () => {
				expectTypeOf(answer.value).toMatchTypeOf<readonly string[]>();
			});

			it('has a string value populated as an array item', () => {
				expect(answer.value).toEqual(['implicit-string']);
			});

			it('has an empty string blank value', () => {
				scenario.answer(selectRelevancePath, 'no');
				answer = getTypedSelectNodeAnswer('/root/implicit-string-value', 'string');
				expect(answer.value).toEqual([]);
			});

			it('sets string values', () => {
				scenario.answer('/root/implicit-string-value', 'implicit-string', 'updated-string');
				answer = getTypedSelectNodeAnswer('/root/implicit-string-value', 'string');
				expect(answer.value).toEqual(['implicit-string', 'updated-string']);
			});
		});

		describe('type="int"', () => {
			let answer: SelectNodeAnswer<'int'>;

			beforeEach(() => {
				answer = getTypedSelectNodeAnswer('/root/int-value', 'int');
			});

			it('has a runtime value which is an array of a single bigint value', () => {
				expect(answer.value).toBeInstanceOf(Array);
				expect(answer.value.length).toBe(1);
				expect(answer.value[0]).toBeTypeOf('bigint');
			});

			it('has a readonly bigint[] static type', () => {
				expectTypeOf(answer.value).toEqualTypeOf<readonly bigint[]>();
			});

			it('has a bigint value populated as an array item', () => {
				expect(answer.value).toEqual([123n]);
			});

			it('has an empty array blank value', () => {
				scenario.answer(selectRelevancePath, 'no');
				answer = getTypedSelectNodeAnswer('/root/int-value', 'int');
				expect(answer.value).toEqual([]);
			});

			describe('setting int values', () => {
				interface SetIntSelectValueCase {
					readonly selectValues: readonly bigint[];
					readonly expectedValue: readonly bigint[];
					readonly reason?: string;
				}

				describe.each<SetIntSelectValueCase>([
					{ selectValues: [89n], expectedValue: [89n] },
					{ selectValues: [10n, 23n], expectedValue: [10n, 23n] },
					{
						selectValues: [23n, 10n],
						expectedValue: [10n, 23n],
						reason:
							'<select> values are written in option order (consistent with JavaRosa, also tested elsewhere with strings)',
					},
					{ selectValues: [], expectedValue: [] },
				])('setValue ($selectValues)', ({ selectValues, expectedValue, reason }) => {
					const selectValuesDescription = JSON.stringify(selectValues.map(String));
					const expectedValueDescription = JSON.stringify(expectedValue.map(String));
					const reasonDescription = reason == null ? '' : `(${reason})`;
					const description =
						`sets ${selectValuesDescription}, resulting in value ${expectedValueDescription} ${reasonDescription}`.trim();

					it(description, () => {
						scenario.proposed_answerTypedSelect('/root/int-value', 'int', selectValues);
						answer = getTypedSelectNodeAnswer('/root/int-value', 'int');

						expectTypeOf(answer.value).toEqualTypeOf<readonly bigint[]>();

						expect(answer.value).toEqual(expectedValue);

						const expectedStringValue = expectedValue.map(String).join(' ');

						expect(answer.stringValue).toBe(expectedStringValue);
					});
				});

				interface SetIntSelectErrorCase {
					readonly selectValues: readonly bigint[];
				}

				// TODO: unsure if there's anything to test here! The values won't be
				// set because they're not available in the select's `valueOptions`.
				describe.skip.each<SetIntSelectErrorCase>([
					{ selectValues: [-2_147_483_649n] },
					{ selectValues: [2_147_483_648n] },
					{ selectValues: [-2_147_483_649n, 2_147_483_648n] },
					{ selectValues: [2_147_483_649n, -2_147_483_648n] },
				])('integer value out of specified bounds ($selectType)', ({ selectValues }) => {
					const selectValuesDescription = JSON.stringify(selectValues.map(String));

					it(`fails to set ${selectValuesDescription}`, () => {
						let caught: unknown;

						try {
							scenario.proposed_answerTypedSelect('/root/int-value', 'int', selectValues);
							answer = getTypedSelectNodeAnswer('/root/int-value', 'int');
						} catch (error) {
							caught = error;
						}

						expect(caught, `Value was set to ${answer.stringValue}`).toBeInstanceOf(Error);
					});
				});
			});
		});

		describe('type="decimal"', () => {
			let answer: SelectNodeAnswer<'decimal'>;

			beforeEach(() => {
				answer = getTypedSelectNodeAnswer('/root/decimal-value', 'decimal');
			});

			it('has a runtime value which is an array of a single number value', () => {
				expect(answer.value).toBeInstanceOf(Array);
				expect(answer.value.length).toBe(1);
				expect(answer.value[0]).toBeTypeOf('number');
			});

			it('has a readonly number[] static type', () => {
				expectTypeOf(answer.value).toEqualTypeOf<readonly number[]>();
			});

			it('has a number populated value', () => {
				expect(answer.value).toEqual([45.67]);
			});

			it('has an empty array blank value', () => {
				scenario.answer(selectRelevancePath, 'no');
				answer = getTypedSelectNodeAnswer('/root/decimal-value', 'decimal');
				expect(answer.value).toEqual([]);
			});

			describe('setting decimal values', () => {
				interface SetDecimalSelectValueCase {
					readonly selectValues: readonly number[];
					readonly expectedValue: readonly number[];
					readonly reason?: string;
				}

				it.each<SetDecimalSelectValueCase>([
					{ selectValues: [89], expectedValue: [89] },
					{ selectValues: [10], expectedValue: [10] },
					{ selectValues: [45.67, 23.4], expectedValue: [45.67, 23.4] },
					{
						selectValues: [23.4, 45.67],
						expectedValue: [45.67, 23.4],
						reason:
							'<select> values are written in option order (consistent with JavaRosa, also tested elsewhere with strings)',
					},
					{ selectValues: [], expectedValue: [] },
				])(
					'sets values $selectValues, resulting in $expectedValue ($reason)',
					({ selectValues, expectedValue }) => {
						scenario.proposed_answerTypedSelect('/root/decimal-value', 'decimal', selectValues);
						answer = getTypedSelectNodeAnswer('/root/decimal-value', 'decimal');

						expectTypeOf(answer.value).toEqualTypeOf<readonly number[]>();

						expect(answer.value).toEqual(expectedValue);

						const expectedStringValue = expectedValue.map(String).join(' ');

						expect(answer.stringValue).toBe(expectedStringValue);
					}
				);
			});
		});
	});

	describe('casting fractional values to int', () => {
		/**
		 * **PORTING NOTES**
		 *
		 * This test is distilled/derived from a test
		 * {@link https://github.com/getodk/web-forms/commit/fd7c7b7659e5babdf218c70d1b580b8460be49b9#diff-82a9bf61dc4ac99cbc7c0f624cb952fe99767787d0c1e11bbc13d563be1e2935R685-R701 | originally ported from JavaRosa}.
		 * In JavaRosa, that test is defined in situ with tests exercising the
		 * `odk-new-repeat` event, but the test itself was not intended to exercise
		 * that functionality. Instead, it was conceptually
		 * {@link https://github.com/getodk/web-forms/pull/110#discussion_r1612400634 | intended}
		 * to exercise the behavior of casting a fractional value _in the form
		 * definition_ to an integer, as specified for an `int` bind type.
		 *
		 * Since implementing `int` support has caused that test to pass, this is an
		 * opportune time to derive a test explicitly exercising that functionality
		 * as intended.
		 */
		describe('jr:count computed from an int node', () => {
			let scenario: Scenario;

			beforeEach(async () => {
				scenario = scenario = await Scenario.init(
					'Cast fractional value to int',
					// prettier-ignore
					html(
						head(
							title('Cast fractional value to int'),
							model(
								mainInstance(
									t('data id="cast-fractional-value-to-int',
										t('count-default', '2.5'),
										t('repeat-count jr:template=""',
											t('anything')))),
								bind('/data/count-default').type('int'))),
						body(
							input('/data/count-default'),
							repeat('/data/repeat-count', '/data/count-default')))
				);
			});

			it('casts a fractional value from a model-defined default', () => {
				expect(scenario.answerOf('/data/count-default')).toEqualAnswer(intAnswer(2));
				expect(scenario.countRepeatInstancesOf('/data/repeat-count')).toBe(2);
			});

			it('casts an updated fractional value', () => {
				scenario.answer('/data/count-default', '4.5');
				expect(scenario.answerOf('/data/count-default')).toEqualAnswer(intAnswer(4));
				expect(scenario.countRepeatInstancesOf('/data/repeat-count')).toBe(4);
			});
		});

		/**
		 * The tests immediately above, which exercise parsing an `int` from a form
		 * definition's fractional value, revealed a gap in that functionality! We
		 * also add these test to ensure the same logic is applied for various
		 * `calculate` expressions and references.
		 *
		 * @todo Coming full circle: we will likely also want to add new tests in
		 * `actions-events.test.ts` to exercise the same for `<setvalue>` events!
		 */
		describe('jr:count computed from a calculate expressions', () => {
			it('casts a fractional value computed from a node with type="string"', async () => {
				const scenario = await Scenario.init(
					'Cast fractional value to int',
					// prettier-ignore
					html(
						head(
							title('Cast fractional value to int'),
							model(
								mainInstance(
									t('data id="cast-fractional-value-to-int',
										t('count-calc-input-str'),
										t('count-calc'),
										t('repeat-count jr:template=""'))),
								bind('/data/count-calc-input-str').type('string'),
								bind('/data/count-calc')
									.type('int')
									.calculate('/data/count-calc-input-str'))),
						body(
							input('/data/count-calc-input-str'),
							repeat('/data/repeat-count', '/data/count-calc')))
				);

				scenario.answer('/data/count-calc-input-str', '3.5');

				expect(scenario.answerOf('/data/count-calc')).toEqualAnswer(intAnswer(3));
				expect(scenario.countRepeatInstancesOf('/data/repeat-count')).toBe(3);
			});

			it('casts a fractional value computed from a node with type="decimal"', async () => {
				const scenario = await Scenario.init(
					'Cast fractional value to int',
					// prettier-ignore
					html(
						head(
							title('Cast fractional value to int'),
							model(
								mainInstance(
									t('data id="cast-fractional-value-to-int',
										t('count-calc-input-dec'),
										t('count-calc'),
										t('repeat-count jr:template=""'))),
								bind('/data/count-calc-input-dec').type('decimal'),
								bind('/data/count-calc')
									.type('int')
									.calculate('/data/count-calc-input-dec'))),
						body(
							input('/data/count-calc-input-dec'),
							repeat('/data/repeat-count', '/data/count-calc')))
				);

				scenario.answer('/data/count-calc-input-dec', 4.5);

				expect(scenario.answerOf('/data/count-calc')).toEqualAnswer(intAnswer(4));
				expect(scenario.countRepeatInstancesOf('/data/repeat-count')).toBe(4);
			});

			it('casts a fractional value computed from a number literal', async () => {
				const scenario = await Scenario.init(
					'Cast fractional value to int',
					// prettier-ignore
					html(
						head(
							title('Cast fractional value to int'),
							model(
								mainInstance(
									t('data id="cast-fractional-value-to-int',
										t('count-calc'),
										t('repeat-count jr:template=""'))),
								bind('/data/count-calc')
									.type('int')
									.calculate('5.5'))),
						body(
							repeat('/data/repeat-count', '/data/count-calc')))
				);

				expect(scenario.answerOf('/data/count-calc')).toEqualAnswer(intAnswer(5));
				expect(scenario.countRepeatInstancesOf('/data/repeat-count')).toBe(5);
			});
		});
	});
});

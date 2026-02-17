import {
	bind,
	body,
	group,
	head,
	html,
	input,
	mainInstance,
	model,
	repeat,
	setvalue,
	setvalueLiteral,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import { describe, expect, it } from 'vitest';
import { intAnswer } from '../../src/answer/ExpectedIntAnswer.ts';
import { stringAnswer } from '../../src/answer/ExpectedStringAnswer.ts';
import { Scenario } from '../../src/jr/Scenario.ts';

describe('setvalue action', () => {
	describe('when trigger node is updated', () => {
		// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/SetValueActionTest.java#L51
		it('target node calculation is evaluated', async () => {
			const scenario = await Scenario.init(
				'Nested setvalue action',
				html(
					head(
						title('Nested setvalue action'),
						model(
							mainInstance(t('data id="nested-setvalue"', t('source'), t('destination'))),
							bind('/data/source').type('int'),
							bind('/data/destination').type('int')
						)
					),
					body(input('/data/source', setvalue('xforms-value-changed', '/data/destination', '4*4')))
				)
			);

			expect(scenario.answerOf('/data/destination').getValue()).toBe('');
			scenario.next('/data/source');
			scenario.answer(22);
			expect(scenario.answerOf('/data/destination')).toEqualAnswer(intAnswer(16));
		});

		describe('with the same value', () => {
			// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/SetValueActionTest.java#L105
			it("does not evaluate the target node's `calculate`", async () => {
				const scenario = await Scenario.init(
					'Nested setvalue action',
					html(
						head(
							title('Nested setvalue action'),
							model(
								mainInstance(
									t('data id="nested-setvalue"', t('source'), t('destination'), t('some-field'))
								),
								bind('/data/destination').type('string')
							)
						),
						body(
							input(
								'/data/source',
								setvalue(
									'xforms-value-changed',
									'/data/destination',
									"concat('foo',/data/some-field)"
								)
							),
							input('/data/some-field')
						)
					)
				);

				expect(scenario.answerOf('/data/destination').getValue()).toBe('');

				scenario.next('/data/source');
				scenario.answer(22);

				expect(scenario.answerOf('/data/destination')).toEqualAnswer(stringAnswer('foo'));

				scenario.next('/data/some-field');
				scenario.answer('bar');

				scenario.prev('/data/source');
				scenario.answer(22);

				expect(scenario.answerOf('/data/destination')).toEqualAnswer(stringAnswer('foo'));

				scenario.answer(23);

				expect(scenario.answerOf('/data/destination')).toEqualAnswer(stringAnswer('foobar'));
			});
		});
	});

	describe('`setvalue`', () => {
		// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/SetValueActionTest.java#L141
		it('is serialized and deserialized', async () => {
			const scenario = await Scenario.init(
				'Nested setvalue action',
				html(
					head(
						title('Nested setvalue action'),
						model(
							mainInstance(t('data id="nested-setvalue"', t('source'), t('destination'))),
							bind('/data/destination').type('int')
						)
					),
					body(input('/data/source', setvalue('xforms-value-changed', '/data/destination', '4*4')))
				)
			);

			await scenario.proposed_serializeAndRestoreInstanceState();

			expect(scenario.answerOf('/data/destination').getValue()).toBe('');

			scenario.next('/data/source');
			scenario.answer(22);

			expect(scenario.answerOf('/data/destination')).toEqualAnswer(intAnswer(16));
		});
	});

	describe('region groups', () => {
		// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/SetValueActionTest.java#L198
		it('`setvalue` in group sets value outside of group', async () => {
			const scenario = await Scenario.init(
				'Setvalue',
				html(
					head(
						title('Setvalue'),
						model(
							mainInstance(t('data id="setvalue"', t('g', t('source')), t('destination'))),
							bind('/data/g/source').type('string'),
							bind('/data/destination').type('int')
						)
					),
					body(
						group(
							'/data/g',
							input(
								'/data/g/source',
								setvalueLiteral('xforms-value-changed', '/data/destination', '7')
							)
						)
					)
				)
			);

			scenario.answer('/data/g/source', 'foo');

			expect(scenario.answerOf('/data/destination')).toEqualAnswer(intAnswer(7));
		});

		// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/SetValueActionTest.java#L224
		it('`setvalue` outside group sets value in group', async () => {
			const scenario = await Scenario.init(
				'Setvalue',
				html(
					head(
						title('Setvalue'),
						model(
							mainInstance(t('data id="setvalue"', t('source'), t('g', t('destination')))),
							bind('/data/source').type('string'),
							bind('/data/g/destination').type('int')
						)
					),
					body(
						input(
							'/data/source',
							setvalueLiteral('xforms-value-changed', '/data/g/destination', '7')
						)
					)
				)
			);

			scenario.answer('/data/source', 'foo');

			expect(scenario.answerOf('/data/g/destination')).toEqualAnswer(intAnswer(7));
		});
	});

	describe('region repeats', () => {
		describe('[`setvalue`] source in repeat', () => {
			// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/SetValueActionTest.java#L251
			it('updates destination in the same repeat instance', async () => {
				const scenario = await Scenario.init(
					'Nested setvalue action with repeats',
					html(
						head(
							title('Nested setvalue action with repeats'),
							model(
								mainInstance(
									t('data id="nested-setvalue-repeats"', t('repeat', t('source'), t('destination')))
								),
								bind('/data/repeat/destination').type('int')
							)
						),
						body(
							repeat(
								'/data/repeat',
								input(
									'/data/repeat/source',
									setvalue('xforms-value-changed', '/data/repeat/destination', '4*position(..)')
								)
							)
						)
					)
				);

				const REPEAT_COUNT = 5;

				for (let i = 1; i <= REPEAT_COUNT; i++) {
					scenario.createNewRepeat('/data/repeat');
					expect(scenario.answerOf('/data/repeat[' + i + ']/destination').getValue()).toBe('');
				}

				for (let i = 1; i <= REPEAT_COUNT; i++) {
					scenario.answer('/data/repeat[' + i + ']/source', 7);
				}

				for (let i = 1; i <= REPEAT_COUNT; i++) {
					expect(scenario.answerOf('/data/repeat[' + i + ']/destination')).toEqualAnswer(
						intAnswer(4 * i)
					);
				}
			});

			it('updates the destination in only the same repeat instance', async () => {
				const scenario = await Scenario.init(
					'Nested setvalue action with repeats',
					html(
						head(
							title('Nested setvalue action with repeats'),
							model(
								mainInstance(
									t('data id="nested-setvalue-repeats"', t('repeat', t('source'), t('destination')))
								),
								bind('/data/repeat/destination').type('int')
							)
						),
						body(
							repeat(
								'/data/repeat',
								input(
									'/data/repeat/source',
									setvalue('xforms-value-changed', '/data/repeat/destination', '4*../source')
								)
							)
						)
					)
				);

				const REPEAT_COUNT = 5;

				for (let i = 1; i <= REPEAT_COUNT; i++) {
					scenario.createNewRepeat('/data/repeat');
					expect(scenario.answerOf('/data/repeat[' + i + ']/destination').getValue()).toBe('');
				}

				for (let i = 1; i <= REPEAT_COUNT; i++) {
					scenario.answer('/data/repeat[' + i + ']/source', i);
				}

				for (let i = 1; i <= REPEAT_COUNT; i++) {
					expect(scenario.answerOf(`/data/repeat[${i}]/source`)).toEqualAnswer(intAnswer(i));
					expect(scenario.answerOf(`/data/repeat[${i}]/destination`)).toEqualAnswer(
						intAnswer(i * 4)
					);
				}

				for (let i = 1; i <= REPEAT_COUNT; i++) {
					expect(scenario.answerOf('/data/repeat[' + i + ']/destination')).toEqualAnswer(
						intAnswer(4 * i)
					);
				}
			});
		});

		describe('`setvalue` at root', () => {
			// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/SetValueActionTest.java#L289
			it('sets value of node in first repeat instance', async () => {
				const scenario = await Scenario.init(
					'Setvalue into repeat',
					html(
						head(
							title('Setvalue into repeat'),
							model(
								mainInstance(
									t('data id="setvalue-into-repeat"', t('source'), t('repeat', t('destination')))
								)
							)
						),
						body(
							input(
								'/data/source',
								setvalue(
									'xforms-value-changed',
									'/data/repeat[position()=1]/destination',
									'/data/source'
								)
							),
							repeat('/data/repeat', input('/data/repeat/destination'))
						)
					)
				);

				scenario.createNewRepeat('/data/repeat');
				scenario.createNewRepeat('/data/repeat');
				scenario.createNewRepeat('/data/repeat');

				scenario.answer('/data/source', 'foo');

				expect(scenario.answerOf('/data/repeat[1]/destination').getValue()).toBe('foo');
				expect(scenario.answerOf('/data/repeat[2]/destination').getValue()).toBe('');
				expect(scenario.answerOf('/data/repeat[3]/destination').getValue()).toBe('');
				expect(scenario.answerOf('/data/repeat[4]/destination').getValue()).toBe('');
			});

			it("sets value of node in first repeat instance, as specified in the action's predicate", async () => {
				const scenario = await Scenario.init(
					'Setvalue into first repeat instance',
					html(
						head(
							title('Setvalue into first repeat instance'),
							model(
								mainInstance(
									t(
										'data id="setvalue-into-first-repeat-instance"',
										t('source'),
										t('repeat', t('destination'))
									)
								)
							)
						),
						body(
							input(
								'/data/source',
								setvalue(
									'xforms-value-changed',
									'/data/repeat[position()=1]/destination',
									'/data/source'
								)
							),
							repeat('/data/repeat', input('/data/repeat/destination'))
						)
					)
				);

				scenario.createNewRepeat('/data/repeat');
				scenario.createNewRepeat('/data/repeat');
				scenario.createNewRepeat('/data/repeat');

				expect(scenario.answerOf('/data/repeat[1]/destination').getValue()).toBe('');
				expect(scenario.answerOf('/data/repeat[2]/destination').getValue()).toBe('');
				expect(scenario.answerOf('/data/repeat[3]/destination').getValue()).toBe('');

				scenario.answer('/data/source', 'foo');

				expect(scenario.answerOf('/data/repeat[1]/destination').getValue()).toBe('foo');
				expect(scenario.answerOf('/data/repeat[2]/destination').getValue()).toBe('');
				expect(scenario.answerOf('/data/repeat[3]/destination').getValue()).toBe('');
			});

			// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/SetValueActionTest.java#L319
			it('sets value of node in repeat instance added after form load', async () => {
				const scenario = await Scenario.init(
					'Setvalue into repeat',
					html(
						head(
							title('Setvalue into repeat'),
							model(
								mainInstance(
									t('data id="setvalue-into-repeat"', t('source'), t('repeat', t('destination')))
								)
							)
						),
						body(
							input(
								'/data/source',
								setvalue(
									'xforms-value-changed',
									'/data/repeat[position()=2]/destination',
									'/data/source'
								)
							),
							repeat('/data/repeat', input('/data/repeat/destination'))
						)
					)
				);

				scenario.createNewRepeat('/data/repeat');
				scenario.createNewRepeat('/data/repeat');
				scenario.createNewRepeat('/data/repeat');

				scenario.answer('/data/source', 'foo');

				expect(scenario.answerOf('/data/repeat[2]/destination').getValue()).toBe('foo');
			});

			// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/SetValueActionTest.java#L348
			it('throws error when target is an unbound reference', async () => {
				const scenario = await Scenario.init(
					'Setvalue into repeat',
					html(
						head(
							title('Setvalue into repeat'),
							model(
								mainInstance(
									t('data id="setvalue-into-repeat"', t('source'), t('repeat', t('destination')))
								)
							)
						),
						body(
							input(
								'/data/source',
								setvalue('xforms-value-changed', '/data/repeat/destination', '/data/source')
							),
							repeat('/data/repeat', input('/data/repeat/destination'))
						)
					)
				);

				scenario.createNewRepeat('/data/repeat');
				scenario.createNewRepeat('/data/repeat');
				scenario.createNewRepeat('/data/repeat');
				const answer = () => {
					scenario.answer('/data/source', 'foo');
					expect.fail('Expected multiple node target to fail');
				};

				expect(answer).toThrowError('has more than one node');
			});
		});

		describe('`setvalue` in repeat', () => {
			// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/SetValueActionTest.java#L381
			it('sets value outside of repeat', async () => {
				const scenario = await Scenario.init(
					'Nested setvalue action with repeats',
					html(
						head(
							title('Nested setvalue action with repeats'),
							model(
								mainInstance(
									t(
										'data id="nested-setvalue-repeats"',
										t('destination', '0'),
										t('repeat', t('source'))
									)
								),
								bind('/data/destination').type('int')
							)
						),
						body(
							repeat(
								'/data/repeat',
								input(
									'/data/repeat/source',
									setvalue('xforms-value-changed', '/data/destination', '.+1')
								)
							)
						)
					)
				);

				scenario.createNewRepeat('/data/repeat');
				expect(scenario.answerOf('/data/destination')).toEqualAnswer(intAnswer(0));

				scenario.answer('/data/repeat[1]/source', 7);
				expect(scenario.answerOf('/data/destination')).toEqualAnswer(intAnswer(1));
			});
		});

		describe('`setvalue` in outer repeat', () => {
			// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/SetValueActionTest.java#L416
			it('sets inner repeat value', async () => {
				const scenario = await Scenario.init(
					'Nested repeats',
					html(
						head(
							title('Nested repeats'),
							model(
								mainInstance(
									t(
										'data id="nested-repeats"',
										t('repeat1', t('source'), t('repeat2', t('destination')))
									)
								)
							)
						),
						body(
							repeat(
								'/data/repeat1',
								input(
									'/data/repeat1/source',
									setvalue(
										'xforms-value-changed',
										'/data/repeat1/repeat2/destination',
										'../../source'
									)
								),
								repeat('/data/repeat1/repeat2', input('/data/repeat1/repeat2/destination'))
							)
						)
					)
				);

				scenario.answer('/data/repeat1[1]/source', 'foo');
				expect(scenario.answerOf('/data/repeat1[1]/repeat2[1]/destination').getValue()).toBe('foo');
			});
		});
	});

	describe('`setvalue`', () => {
		// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/SetValueActionTest.java#L448
		it('sets value of `readonly` field', async () => {
			const scenario = await Scenario.init(
				'Setvalue readonly',
				html(
					head(
						title('Setvalue readonly'),
						model(
							mainInstance(t('data id="setvalue-readonly"', t('readonly-field'))),
							bind('/data/readonly-field').readonly('1').type('int'),
							setvalue('odk-instance-first-load', '/data/readonly-field', '4*4')
						)
					),
					body(input('/data/readonly-field'))
				)
			);

			expect(scenario.answerOf('/data/readonly-field')).toEqualAnswer(intAnswer(16));
		});

		it('does not update after load', async () => {
			const scenario = await Scenario.init(
				'Setvalue readonly',
				html(
					head(
						title('Setvalue readonly'),
						model(
							mainInstance(t('data id="setvalue-readonly"', t('output'), t('input', '5'))),
							bind('/data/output').type('int'),
							setvalue('odk-instance-first-load', '/data/output', '/data/input * 4')
						)
					),
					body(input('/data/output'), input('/data/input'))
				)
			);

			expect(scenario.answerOf('/data/output')).toEqualAnswer(intAnswer(20));
			scenario.answer('/data/input', '4');
			expect(scenario.answerOf('/data/output')).toEqualAnswer(intAnswer(20));
		});

		it('does not update after field becomes relevant', async () => {
			const scenario = await Scenario.init(
				'Setvalue readonly',
				html(
					head(
						title('Setvalue readonly'),
						model(
							mainInstance(t('data id="setvalue-readonly"', t('output'), t('input', '5'))),
							bind('/data/output').relevant('/data/input = 3').type('int'),
							setvalue('odk-instance-first-load', '/data/output', '/data/input * 4')
						)
					),
					body(input('/data/output'), input('/data/input'))
				)
			);

			expect(scenario.answerOf('/data/output')).toEqualAnswer(stringAnswer(''));
			scenario.answer('/data/input', '3'); // makes the output relevant
			expect(scenario.answerOf('/data/output')).toEqualAnswer(stringAnswer(''));
		});

		it('odk-instance-first-load does not update on repeat add', async () => {
			const scenario = await Scenario.init(
				'Setvalue repeat',
				html(
					head(
						title('Setvalue multiple'),
						model(
							mainInstance(t('data id="setvalue-multiple"', t('repeat id=""', t('source')))),
							setvalueLiteral('odk-instance-first-load', '/data/repeat/source', 'first')
						)
					),
					body(repeat('/data/repeat', input('/data/repeat/source')))
				)
			);

			expect(scenario.answerOf('/data/repeat[1]/source').getValue()).toBe('first');
			scenario.createNewRepeat('/data/repeat');
			expect(scenario.answerOf('/data/repeat[1]/source').getValue()).toBe('first');
			expect(scenario.answerOf('/data/repeat[2]/source').getValue()).toBe('');
		});

		// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/SetValueActionTest.java#L468
		describe('with inner empty string', () => {
			it('clears the `ref` target', async () => {
				const scenario = await Scenario.init(
					'Setvalue empty string',
					html(
						head(
							title('Setvalue empty string'),
							model(
								mainInstance(t('data id="setvalue-empty-string"', t('a-field', '12'))),
								bind('/data/a-field').type('int'),
								setvalue('odk-instance-first-load', '/data/a-field')
							)
						),
						body(input('/data/a-field'))
					)
				);
				expect(scenario.answerOf('/data/a-field').getValue()).toBe('');
			});
		});

		describe('with empty string `value` attribute', () => {
			// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/SetValueActionTest.java#L488
			it('clears the `ref` target', async () => {
				const scenario = await Scenario.init(
					'Setvalue empty string',
					html(
						head(
							title('Setvalue empty string'),
							model(
								mainInstance(t('data id="setvalue-empty-string"', t('a-field', '12'))),
								bind('/data/a-field').type('int'),
								setvalue('odk-instance-first-load', '/data/a-field', '')
							)
						),
						body(input('/data/a-field'))
					)
				);
				expect(scenario.answerOf('/data/a-field').getValue()).toBe('');
			});
		});

		// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/SetValueActionTest.java#L508
		it('sets the value of multiple fields', async () => {
			const scenario = await Scenario.init(
				'Setvalue multiple destinations',
				html(
					head(
						title('Setvalue multiple destinations'),
						model(
							mainInstance(
								t('data id="setvalue-multiple"', t('source'), t('destination1'), t('destination2'))
							),
							bind('/data/destination1').type('int'),
							bind('/data/destination2').type('int')
						)
					),
					body(
						input(
							'/data/source',
							setvalueLiteral('xforms-value-changed', '/data/destination1', '7'),
							setvalueLiteral('xforms-value-changed', '/data/destination2', '11')
						)
					)
				)
			);

			scenario.answer('/data/source', 'foo');

			expect(scenario.answerOf('/data/destination1')).toEqualAnswer(intAnswer(7));
			expect(scenario.answerOf('/data/destination2')).toEqualAnswer(intAnswer(11));
		});
	});

	describe('`xforms-value-changed`', () => {
		// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/SetValueActionTest.java#L534
		it('is triggered after a value change recompute', async () => {
			const scenario = await Scenario.init(
				'xforms-value-changed-event',
				html(
					head(
						title('Value changed event'),
						model(
							mainInstance(
								t(
									'data id="xforms-value-changed-event"',
									t('source'),
									t('calculate'),
									t('destination')
								)
							),
							bind('/data/calculate').type('int').calculate('/data/source * 2'),
							bind('/data/destination').type('int')
						)
					),
					body(
						input(
							'/data/source',
							setvalue('xforms-value-changed', '/data/destination', '/data/calculate')
						)
					)
				)
			);

			scenario.answer('/data/source', 12);

			expect(scenario.answerOf('/data/destination')).toEqualAnswer(intAnswer(24));
		});

		it('is not triggered when loading form for editing', async () => {
			const originalDate = '2025-01-01T10:23:28.822+13:00';
			const instanceXML = `<data id="xforms-value-changed-event">
	<source>5</source>
	<destination>${originalDate}</destination>
	<meta>
		<instanceID>uuid:c0b9c932-e78b-474b-8568-48980113a7ac</instanceID>
	</meta>
</data>`;
			const form = html(
				head(
					title('Value changed event'),
					model(
						mainInstance(t('data id="xforms-value-changed-event"', t('source'), t('destination'))),
						bind('/data/destination').type('dateTime')
					)
				),
				body(input('/data/source', setvalue('xforms-value-changed', '/data/destination', 'now()')))
			);
			const scenario = await Scenario.init('upgrade form', form, {
				editInstance: instanceXML,
			});

			expect(scenario.answerOf('/data/destination')).toEqualAnswer(stringAnswer(originalDate));

			scenario.answer('/data/source', 12);
			expect(scenario.answerOf('/data/destination')).not.toEqualAnswer(stringAnswer(originalDate));
		});
	});

	describe('`setvalue`', () => {
		// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/SetValueActionTest.java#L558
		it('sets the value of a bound attribute', async () => {
			const scenario = await Scenario.init(
				'Setvalue attribute',
				html(
					head(
						title('Setvalue attribute'),
						model(
							mainInstance(t('data id="setvalue-attribute"', t('element attr=""'))),
							setvalue('odk-instance-first-load', '/data/element/@attr', '7')
						)
					),
					body(input('/data/element'))
				)
			);

			expect(scenario.attributeOf('/data/element', 'attr').getValue()).toBe('7');
		});

		// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/SetValueActionTest.java#L577
		it('sets the value of a bound attribute, after deserialization', async () => {
			const scenario = await Scenario.init(
				'Setvalue attribute',
				html(
					head(
						title('Setvalue attribute'),
						model(
							mainInstance(t('data id="setvalue-attribute"', t('element attr=""'))),
							setvalue('odk-instance-first-load', '/data/element/@attr', '7')
						)
					),
					body(input('/data/element'))
				)
			);

			expect(scenario.attributeOf('/data/element', 'attr').getValue()).toBe('7');
			const cached = await scenario.proposed_serializeAndRestoreInstanceState();
			const newInstance = cached.newInstance();
			expect(newInstance.attributeOf('/data/element', 'attr').getValue()).toBe('7');
		});
	});
});

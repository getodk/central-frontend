import {
	bind,
	body,
	head,
	html,
	input,
	mainInstance,
	model,
	repeat,
	setvalue,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import { describe, expect, it } from 'vitest';
import { intAnswer } from '../../src/answer/ExpectedIntAnswer.ts';
import { Scenario } from '../../src/jr/Scenario.ts';
import { r } from '../../src/jr/resource/ResourcePathHelper.ts';

describe('OdkNewRepeatEventTest.java', () => {
	describe('setvalue on add repeat ', () => {
		// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/OdkNewRepeatEventTest.java#L32
		it('sets the value in the repeat', async () => {
			const scenario = await Scenario.init(r('event-odk-new-repeat.xml'));
			expect(scenario.countRepeatInstancesOf('/data/my-repeat')).toBe(0);
			scenario.createNewRepeat('/data/my-repeat');
			expect(scenario.countRepeatInstancesOf('/data/my-repeat')).toBe(1);
			expect(scenario.answerOf('/data/my-repeat[1]/defaults-to-position').getValue()).toBe('1');
		});
	});

	describe('adding repeat instance', () => {
		// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/OdkNewRepeatEventTest.java#L42
		it('does not change the value set for the previous repeat instance', async () => {
			const scenario = await Scenario.init(r('event-odk-new-repeat.xml'));
			scenario.createNewRepeat('/data/my-repeat');
			expect(scenario.answerOf('/data/my-repeat[1]/defaults-to-position').getValue()).toBe('1');
			scenario.createNewRepeat('/data/my-repeat');
			expect(scenario.answerOf('/data/my-repeat[2]/defaults-to-position').getValue()).toBe('2');
			expect(scenario.answerOf('/data/my-repeat[1]/defaults-to-position').getValue()).toBe('1');
		});
	});

	describe('setvalue on repeat in body', () => {
		// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/OdkNewRepeatEventTest.java#L55
		it('uses the current context for relative references', async () => {
			const scenario = await Scenario.init(r('event-odk-new-repeat.xml'));
			scenario.answer('/data/my-toplevel-value', '12');
			scenario.createNewRepeat('/data/my-repeat');
			expect(scenario.answerOf('/data/my-repeat[1]/defaults-to-toplevel').getValue()).toBe('14');
		});
	});

	describe('setvalue on repeat with count', () => {
		// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/OdkNewRepeatEventTest.java#L65
		it('sets the value for each repeat instance', async () => {
			const scenario = await Scenario.init(r('event-odk-new-repeat.xml'));

			const REPEAT_COUNT = 4;
			scenario.answer('/data/repeat-count', REPEAT_COUNT);

			for (let i = 1; i < REPEAT_COUNT; i++) {
				scenario.next(`/data/my-jr-count-repeat[${i}]`);
				scenario.next(`/data/my-jr-count-repeat[${i}]/defaults-to-position-again`);
				expect(
					scenario.answerOf(`/data/my-jr-count-repeat[${i}]/defaults-to-position-again`).getValue()
				).toBe(`${i}`);
			}

			expect(scenario.countRepeatInstancesOf('/data/my-jr-count-repeat')).toBe(REPEAT_COUNT);

			// Adding repeats should trigger odk-new-repeat for those new nodes
			const NEW_REPEAT_COUNT = 6;
			scenario.answer('/data/repeat-count', NEW_REPEAT_COUNT);

			scenario.jumpToBeginningOfForm();

			scenario.next('/data/my-toplevel-value');
			scenario.next('/data/my-repeat');
			scenario.next('/data/repeat-count');
			for (let i = 1; i < NEW_REPEAT_COUNT; i++) {
				scenario.next(`/data/my-jr-count-repeat[${i}]`);
				scenario.next(`/data/my-jr-count-repeat[${i}]/defaults-to-position-again`);
			}

			expect(scenario.countRepeatInstancesOf('/data/my-jr-count-repeat')).toBe(6);

			expect(
				scenario.answerOf('/data/my-jr-count-repeat[6]/defaults-to-position-again').getValue()
			).toBe('6');
		});
	});

	// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/OdkNewRepeatEventTest.java#L94
	describe('setvalue other than integer value, on repeat with count', () => {
		it('casts an integer-as-string value to an integer', async () => {
			const scenario = await Scenario.init(r('event-odk-new-repeat.xml'));
			scenario.answer('/data/repeat-count', '1');
			expect(scenario.answerOf('/data/repeat-count')).toEqualAnswer(intAnswer(1));
		});

		it('casts a decimal/fractional value to an integer', async () => {
			const scenario = await Scenario.init(r('event-odk-new-repeat.xml'));
			scenario.answer('/data/repeat-count', 2.5);
			expect(scenario.answerOf('/data/repeat-count')).toEqualAnswer(intAnswer(2));
		});

		it('assigns a non-fractional integer-as-float-number', async () => {
			const scenario = await Scenario.init(r('event-odk-new-repeat.xml'));
			scenario.answer('/data/repeat-count', 2);
			expect(scenario.answerOf('/data/repeat-count')).toEqualAnswer(intAnswer(2));
		});

		it('casts and/or assigns bigint', async () => {
			const scenario = await Scenario.init(r('event-odk-new-repeat.xml'));
			scenario.answer('/data/repeat-count', 3n);
			expect(scenario.answerOf('/data/repeat-count')).toEqualAnswer(intAnswer(3));
		});
	});

	describe('repeat in form def instance', () => {
		// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/OdkNewRepeatEventTest.java#L122
		it('never fires an odk-new-repeat new repeat event', async () => {
			const scenario = await Scenario.init(r('event-odk-new-repeat.xml'));
			expect(scenario.answerOf('/data/my-repeat-without-template[1]/my-value').getValue()).toBe('');
			expect(scenario.answerOf('/data/my-repeat-without-template[2]/my-value').getValue()).toBe('');
			scenario.createNewRepeat('/data/my-repeat-without-template');
			expect(scenario.answerOf('/data/my-repeat-without-template[3]/my-value').getValue()).toBe(
				'2'
			);
		});
	});

	describe('new repeat instance', () => {
		// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/OdkNewRepeatEventTest.java#L133
		it('does not trigger the action on an unrelated repeat instance', async () => {
			const scenario = await Scenario.init(
				'Parallel repeats',
				html(
					head(
						title('Parallel repeats'),
						model(
							mainInstance(
								t(
									'data id="parallel-repeats"',
									t('repeat1', t('q1')),

									t('repeat2', t('q1'))
								)
							)
						)
					),
					body(
						repeat(
							'/data/repeat1',
							setvalue('odk-new-repeat', '/data/repeat1/q1', "concat('foo','bar')"),
							input('/data/repeat1/q1')
						),
						repeat(
							'/data/repeat2',
							setvalue('odk-new-repeat', '/data/repeat2/q1', "concat('bar','baz')"),
							input('/data/repeat2/q1')
						)
					)
				)
			);

			scenario.createNewRepeat('/data/repeat1');
			scenario.createNewRepeat('/data/repeat1');

			scenario.createNewRepeat('/data/repeat2');
			scenario.createNewRepeat('/data/repeat2');

			expect(scenario.answerOf('/data/repeat1[2]/q1').getValue()).toBe('foobar');
			expect(scenario.answerOf('/data/repeat1[3]/q1').getValue()).toBe('foobar');
			expect(scenario.answerOf('/data/repeat2[2]/q1').getValue()).toBe('barbaz');
			expect(scenario.answerOf('/data/repeat2[3]/q1').getValue()).toBe('barbaz');
		});

		// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/OdkNewRepeatEventTest.java#L172
		it('can use the previous instance as the default', async () => {
			const scenario = await Scenario.init(
				'Default from prior instance',
				html(
					head(
						title('Default from prior instance'),
						model(
							mainInstance(t('data id="default-from-prior-instance"', t('repeat', t('q')))),
							bind('/data/repeat/q').type('integer')
						)
					),
					body(
						repeat(
							'/data/repeat',
							setvalue(
								'odk-new-repeat',
								'/data/repeat/q',
								'/data/repeat[position()=position(current()/..)-1]/q'
							),
							input('/data/repeat/q')
						)
					)
				)
			);

			scenario.next('/data/repeat[1]');
			scenario.next('/data/repeat[1]/q');
			scenario.answer(7);

			expect(scenario.answerOf('/data/repeat[1]/q')).toEqualAnswer(intAnswer(7));

			scenario.next('/data/repeat');
			scenario.createNewRepeat({
				assertCurrentReference: '/data/repeat',
			});

			scenario.next('/data/repeat[2]/q');

			expect(scenario.answerOf('/data/repeat[2]/q')).toEqualAnswer(intAnswer(7));

			scenario.answer(8); // override the default

			scenario.next('/data/repeat');
			scenario.createNewRepeat({
				assertCurrentReference: '/data/repeat',
			});

			scenario.next('/data/repeat[3]/q');

			expect(scenario.answerOf('/data/repeat[1]/q')).toEqualAnswer(intAnswer(7));
			expect(scenario.answerOf('/data/repeat[2]/q')).toEqualAnswer(intAnswer(8));
			expect(scenario.answerOf('/data/repeat[3]/q')).toEqualAnswer(intAnswer(8));
		});
	});

	describe('setvalue on repeat insert in model', () => {
		// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/OdkNewRepeatEventTest.java#L209
		it('throws an error', async () => {
			let caught: unknown = null;

			try {
				await Scenario.init(r('event-odk-new-repeat-model.xml'));
			} catch (error) {
				caught = error;
			}

			expect(caught).toBeInstanceOf(Error);
		});
	});
});

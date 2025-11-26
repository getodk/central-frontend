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
import { stringAnswer } from '../../src/answer/ExpectedStringAnswer.ts';
import { Scenario } from '../../src/jr/Scenario.ts';

describe('instance load events', () => {
	describe('odk-instance-load event', () => {
		// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/InstanceLoadEventsTest.java#L28
		it('fires event on first load', async () => {
			const scenario = await Scenario.init(
				'Instance load form',
				html(
					head(
						title('Instance load form'),
						model(
							mainInstance(t('data id="instance-load-form"', t('q1'))),
							bind('/data/q1').type('int'),
							setvalue('odk-instance-load', '/data/q1', '4*4')
						)
					),
					body(input('/data/q1'))
				)
			);

			expect(scenario.answerOf('/data/q1')).toEqualAnswer(intAnswer(16));
		});

		// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/InstanceLoadEventsTest.java#L48
		it('fires on second load', async () => {
			const scenario = await Scenario.init(
				'Instance load form',
				html(
					head(
						title('Instance load form'),
						model(
							mainInstance(t('data id="instance-load-form"', t('q1'))),
							bind('/data/q1').type('int'),
							setvalue('odk-instance-load', '/data/q1', '4*4')
						)
					),
					body(input('/data/q1'))
				)
			);

			expect(scenario.answerOf('/data/q1')).toEqualAnswer(intAnswer(16));
			scenario.answer('/data/q1', 555);
			const restored = await scenario.proposed_serializeAndRestoreInstanceState();
			expect(restored.answerOf('/data/q1')).toEqualAnswer(intAnswer(16));
		});

		// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/InstanceLoadEventsTest.java#L96
		it('triggers nested actions', async () => {
			const scenario = await Scenario.init(
				'Nested instance load',
				html(
					head(
						title('Nested instance load'),
						model(
							mainInstance(t('data id="nested-instance-load"', t('repeat', t('q1')))),
							bind('/data/repeat/q1').type('string')
						)
					),
					body(
						repeat(
							'/data/repeat',
							setvalue('odk-instance-load', '/data/repeat/q1', '4*4'),
							input('/data/repeat/q1')
						)
					)
				)
			);

			expect(scenario.answerOf('/data/repeat[1]/q1')).toEqualAnswer(stringAnswer('16'));
			scenario.createNewRepeat('/data/repeat');
			expect(scenario.answerOf('/data/repeat[2]/q1').getValue()).toBe('');
		});

		// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/InstanceLoadEventsTest.java#L121
		it('is triggered for all pre-existing repeat instances', async () => {
			const scenario = await Scenario.init(
				'Nested instance load',
				html(
					head(
						title('Nested instance load'),
						model(
							mainInstance(
								t('data id="nested-instance-load"', t('repeat', t('q1')), t('repeat', t('q1')))
							),
							bind('/data/repeat/q1').type('string')
						)
					),
					body(
						repeat(
							'/data/repeat',
							setvalue('odk-instance-load', '/data/repeat/q1', '4*4'),
							input('/data/repeat/q1')
						)
					)
				)
			);

			expect(scenario.answerOf('/data/repeat[1]/q1')).toEqualAnswer(stringAnswer('16'));
			expect(scenario.answerOf('/data/repeat[2]/q1')).toEqualAnswer(stringAnswer('16'));

			scenario.createNewRepeat('/data/repeat');

			expect(scenario.answerOf('/data/repeat[3]/q1').getValue()).toBe('');
		});
	});

	describe('odk-instance-first-load event', () => {
		// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/InstanceLoadEventsTest.java#L72
		it('does not fire when restoring', async () => {
			const scenario = await Scenario.init(
				'Instance load form',
				html(
					head(
						title('Instance load form'),
						model(
							mainInstance(t('data id="instance-load-form"', t('q1'))),
							bind('/data/q1').type('int'),
							setvalue('odk-instance-first-load', '/data/q1', '4*4')
						)
					),
					body(input('/data/q1'))
				)
			);

			expect(scenario.answerOf('/data/q1')).toEqualAnswer(intAnswer(16));
			scenario.answer('/data/q1', 555);
			const restored = await scenario.proposed_serializeAndRestoreInstanceState();
			expect(restored.answerOf('/data/q1')).toEqualAnswer(intAnswer(555));
		});

		it('does not fire when editing', async () => {
			const scenario = await Scenario.init(
				'Instance load form',
				html(
					head(
						title('Instance load form'),
						model(
							mainInstance(t('data id="instance-load-form"', t('q1'))),
							bind('/data/q1').type('int'),
							setvalue('odk-instance-first-load', '/data/q1', '4*4')
						)
					),
					body(input('/data/q1'))
				)
			);

			expect(scenario.answerOf('/data/q1')).toEqualAnswer(intAnswer(16));
			scenario.answer('/data/q1', 555);
			const restored = await scenario.proposed_editCurrentInstanceState();
			expect(restored.answerOf('/data/q1')).toEqualAnswer(intAnswer(555));
		});
	});
});

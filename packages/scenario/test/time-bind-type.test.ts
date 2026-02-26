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
import { assert, beforeEach, describe, expect, it } from 'vitest';
import { InputNodeAnswer } from '../src/answer/InputNodeAnswer.ts';
import { ModelValueNodeAnswer } from '../src/answer/ModelValueNodeAnswer.ts';
import { Scenario } from '../src/jr/Scenario.ts';

describe('Time bind type', () => {
	const formTitle = 'Time bind types';
	const relevancePath = '/root/relevance-trigger';
	const relevanceExpression = `${relevancePath} = 'yes'`;

	const formDefinition = html(
		head(
			title(formTitle),
			model(
				mainInstance(
					t(
						'root id="time-types"',
						t('relevance-trigger', 'yes'),
						t('model-only-time', '22:02:55.124'),
						t('input-time', '14:02:10')
					)
				),
				bind('/root/model-only-time').type('time').relevant(relevanceExpression),
				bind('/root/input-time').type('time').relevant(relevanceExpression)
			)
		),
		body(input(relevancePath), input('/root/input-time'))
	);

	let scenario: Scenario;
	beforeEach(async () => {
		scenario = await Scenario.init(formTitle, formDefinition);
	});

	describe('model-only values', () => {
		const getModelAnswer = () => {
			const answer = scenario.answerOf('/root/model-only-time');
			assert(answer instanceof ModelValueNodeAnswer);
			assert(answer.valueType === 'time');
			return answer as ModelValueNodeAnswer<'time'>;
		};

		it('has correct static type', () => {
			const answer = getModelAnswer();
			expect(answer.value).toBeTypeOf('string');
		});

		it('has a time populated value', () => {
			const answer = getModelAnswer();
			expect(answer.value).to.equal('22:02:55.124');
		});

		it('has null as a blank value when not relevant', () => {
			scenario.answer(relevancePath, 'no');
			const answer = getModelAnswer();
			expect(answer.value).toBeNull();
		});
	});

	describe('inputs', () => {
		const getInputAnswer = () => {
			const answer = scenario.answerOf('/root/input-time');
			assert(answer instanceof InputNodeAnswer);
			assert(answer.valueType === 'time');
			return answer as InputNodeAnswer<'time'>;
		};

		it('has correct static type', () => {
			const answer = getInputAnswer();
			expect(answer.value).toBeTypeOf('string');
		});

		it('has a time populated value', () => {
			const answer = getInputAnswer();
			expect(answer.value).to.equal('14:02:10');
			expect(answer.stringValue).toEqual('14:02:10');
		});

		it('has null as a blank value when not relevant', () => {
			scenario.answer(relevancePath, 'no');
			const answer = getInputAnswer();
			expect(answer.value).toBeNull();
			expect(answer.stringValue).toBe('');
		});

		it.each([
			'22:02:00.000+07:00',
			'22:02:00+07:00',
			'22:02:00.000-07:00',
			'22:02:00-07:00',
			'22:02:00.000Z',
			'22:02:00Z',
			'22:02:00.000',
			'22:02:00',
		])('sets value with valid time (%s)', (expression) => {
			scenario.answer('/root/input-time', expression);
			const answer = getInputAnswer();

			expect(answer.value).to.deep.equal(expression);
			expect(answer.stringValue).toEqual(expression);
		});

		it.each([
			'25:02:00',
			'24:00:00',
			'22:60:00',
			'22:02:61',
			'22:02',
			'22',
			'22:02:00+25:00',
			'22:02:00+invalid',
			'22:02:00.Z', // Malformed decimal/Z combination
			'noon',
			'XX:YY:ZZ',
			'2026-02-24T22:02:00',
		])('has null when incorrect value %s is passed', (expression) => {
			scenario.answer('/root/input-time', expression);
			const answer = getInputAnswer();

			expect(answer.value).toBeNull();
			expect(answer.stringValue).toBe('');
		});
	});
});

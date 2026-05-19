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
} from '@getodk/common/test-utils/xform-dsl/index.ts';
import { assert, beforeEach, describe, expect, it } from 'vitest';
import { InputNodeAnswer } from '../src/answer/InputNodeAnswer.ts';
import { ModelValueNodeAnswer } from '../src/answer/ModelValueNodeAnswer.ts';
import { Scenario } from '../src/jr/Scenario.ts';

describe('Datetime bind type', () => {
	const formTitle = 'Datetime bind types';
	const relevancePath = '/root/relevance-trigger';
	const relevanceExpression = `${relevancePath} = 'yes'`;

	const formDefinition = html(
		head(
			title(formTitle),
			model(
				mainInstance(
					t(
						'root id="datetime-types"',
						t('relevance-trigger', 'yes'),
						t('model-only-datetime', '2026-04-22T14:30:00.123Z'),
						t('input-datetime', '2026-01-01T00:00:00Z')
					)
				),
				bind('/root/model-only-datetime').type('dateTime').relevant(relevanceExpression),
				bind('/root/input-datetime').type('dateTime').relevant(relevanceExpression)
			)
		),
		body(input(relevancePath), input('/root/input-datetime'))
	);

	let scenario: Scenario;
	beforeEach(async () => {
		scenario = await Scenario.init(formTitle, formDefinition);
	});

	describe('model-only values', () => {
		const getModelAnswer = () => {
			const answer = scenario.answerOf('/root/model-only-datetime');
			assert(answer instanceof ModelValueNodeAnswer);
			assert(answer.valueType === 'dateTime');
			return answer as ModelValueNodeAnswer<'dateTime'>;
		};

		it('has correct static type', () => {
			const answer = getModelAnswer();
			expect(answer.value).toBeTypeOf('string');
		});

		it('has a datetime populated value', () => {
			const answer = getModelAnswer();
			expect(answer.value).to.equal('2026-04-22T14:30:00.123Z');
		});

		it('has null as a blank value when not relevant', () => {
			scenario.answer(relevancePath, 'no');
			const answer = getModelAnswer();
			expect(answer.value).toBeNull();
		});
	});

	describe('inputs', () => {
		const getInputAnswer = () => {
			const answer = scenario.answerOf('/root/input-datetime');
			assert(answer instanceof InputNodeAnswer);
			assert(answer.valueType === 'dateTime');
			return answer as InputNodeAnswer<'dateTime'>;
		};

		it('has correct static type', () => {
			const answer = getInputAnswer();
			expect(answer.value).toBeTypeOf('string');
		});

		it('has a datetime populated value', () => {
			const answer = getInputAnswer();
			expect(answer.value).to.equal('2026-01-01T00:00:00Z');
			expect(answer.stringValue).toEqual('2026-01-01T00:00:00Z');
		});

		it('has null as a blank value when not relevant', () => {
			scenario.answer(relevancePath, 'no');
			const answer = getInputAnswer();
			expect(answer.value).toBeNull();
			expect(answer.stringValue).toBe('');
		});

		it.each([
			['standard UTC time', '2026-04-22T14:30:00Z'],
			['positive timezone offset', '2026-04-22T14:30:00+07:00'],
			['negative timezone offset', '2026-04-22T14:30:00-05:00'],
			['fractional seconds', '2026-04-22T14:30:00.123Z'],
			['local time without timezone', '2026-04-22T14:30:00'],
			['leap year', '2024-02-29T12:00:00Z'],
			['end of year and day', '2026-12-31T23:59:59Z'],
			['beginning of year and day', '2026-01-01T00:00:00Z'],
		])('sets value with valid datetime: %s (%s)', (_description, expression) => {
			scenario.answer('/root/input-datetime', expression);
			const answer = getInputAnswer();

			expect(answer.value).to.deep.equal(expression);
			expect(answer.stringValue).toEqual(expression);
		});

		it.each([
			['missing T separator', '2026-04-22 14:30:00Z'],
			['missing time component', '2026-04-22'],
			['missing date component', '14:30:00Z'],
			['wrong date order (MM-DD-YYYY)', '04-22-2026T14:30:00Z'],
			['two-digit year', '26-04-22T14:30:00Z'],
			['invalid month (13)', '2026-13-22T14:30:00Z'],
			['invalid day for month (April 31)', '2026-04-31T14:30:00Z'],
			['invalid leap year (Feb 29 on non-leap year)', '2026-02-29T14:30:00Z'],
			['invalid hour (25)', '2026-04-22T25:30:00Z'],
			['invalid minute (60)', '2026-04-22T14:60:00Z'],
			['invalid second (61)', '2026-04-22T14:30:61Z'],
			['invalid timezone format (missing colon)', '2026-04-22T14:30:00+0700'],
			['lack of zero-padding', '2026-4-2T14:3:0Z'],
			['free text string', 'not a datetime'],
		])('has null when invalid datetime is passed: %s (%s)', (_description, expression) => {
			scenario.answer('/root/input-datetime', expression);
			const answer = getInputAnswer();

			expect(answer.value).toBeNull();
			expect(answer.stringValue).toBe('');
		});
	});
});

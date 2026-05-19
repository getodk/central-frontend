import { beforeEach, describe, expect, it } from 'vitest';
import { Scenario } from '../src/jr/Scenario.ts';
import { r } from '../src/jr/resource/ResourcePathHelper.ts';

describe('Range', () => {
	let scenario: Scenario;

	beforeEach(async () => {
		scenario = await Scenario.init(r('range-form.xml'));
	});

	it('should allow range to be read', () => {
		expect(scenario.answerOf('/stats/balance').getValue()).toBe('');
	});

	it('should allow range to be set', () => {
		scenario.answer('/stats/balance', '-1');
		expect(scenario.answerOf('/stats/balance').getValue()).toBe('-1.0');
	});

	it('nulls out value if value is out of range', () => {
		scenario.answer('/stats/balance', '-5');
		expect(scenario.answerOf('/stats/balance').getValue()).toBe('');
	});
});

import { describe, expect, it } from 'vitest';
import { Scenario } from '../../src/jr/Scenario.ts';

describe('multiple events', () => {
	describe('nested first load event', () => {
		// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/MultipleEventsTest.java#L21
		it('sets the value when nested', async () => {
			const scenario = await Scenario.init('multiple-events.xml');
			expect(scenario.answerOf('/data/nested-first-load').getValue()).toBe('cheese');
		});

		// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/MultipleEventsTest.java#L28
		it('sets the value when nested in group', async () => {
			const scenario = await Scenario.init('multiple-events.xml');
			expect(scenario.answerOf('/data/my-group/nested-first-load-in-group').getValue()).toBe(
				'more cheese'
			);
		});
	});

	describe('serialized and deserialized nested odk-instance-first-load first load event', () => {
		// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/MultipleEventsTest.java#L35
		it('sets the value when nested', async () => {
			const scenario = await Scenario.init('multiple-events.xml');
			const deserializedScenario = await scenario.proposed_serializeAndRestoreInstanceState();
			const newInstance = deserializedScenario.newInstance();
			expect(newInstance.answerOf('/data/nested-first-load').getValue()).toBe('cheese');
		});

		// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/MultipleEventsTest.java#L44
		it('sets the value when nested in group', async () => {
			const scenario = await Scenario.init('multiple-events.xml');
			const deserializedScenario = await scenario.proposed_serializeAndRestoreInstanceState();
			const newInstance = deserializedScenario.newInstance();
			expect(newInstance.answerOf('/data/my-group/nested-first-load-in-group').getValue()).toBe(
				'more cheese'
			);
		});
	});

	describe('nested odk-instance-first-load and xforms-value-changed events', () => {
		// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/MultipleEventsTest.java#L53
		it('sets the value', async () => {
			const scenario = await Scenario.init('multiple-events.xml');
			expect(scenario.answerOf('/data/my-calculated-value').getValue()).toBe('10');
			scenario.answer('/data/my-value', '15');
			expect(scenario.answerOf('/data/my-calculated-value').getValue()).toBe('30');
		});
	});

	describe('serialized and deserialized nested odk-instance-first-load and xforms-value-changed events', () => {
		// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/MultipleEventsTest.java#L62
		it('sets the value', async () => {
			const scenario = await Scenario.init('multiple-events.xml');
			const deserializedScenario = await scenario.proposed_serializeAndRestoreInstanceState();
			const newInstance = deserializedScenario.newInstance();
			expect(newInstance.answerOf('/data/my-calculated-value').getValue()).toBe('10');
			newInstance.answer('/data/my-value', '15');
			expect(newInstance.answerOf('/data/my-calculated-value').getValue()).toBe('30');
		});
	});

	describe('invalid event names', () => {
		// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/MultipleEventsTest.java#L73
		it('throws an exception', async () => {
			const init = async () => {
				await Scenario.init('invalid-events.xml');
			};
			await expect(init).rejects.toThrowError(
				'An action was registered for unsupported events: odk-inftance-first-load, my-fake-event'
			);
		});
	});
});

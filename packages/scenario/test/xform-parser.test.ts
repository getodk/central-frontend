import { describe, expect, it } from 'vitest';
import { Scenario } from '../src/jr/Scenario.ts';

describe('XFormParserTest.java', () => {
	// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/xform/parse/XFormParserTest.java#L462
	it('sets default value', async () => {
		const scenario = await Scenario.init('default_test.xml');

		expect(scenario.getInstanceNode('/data/string_val').currentState.value).toBe('string-value');
		expect(scenario.getInstanceNode('/data/inline_val').currentState.value).toBe('inline-value');
	});
});

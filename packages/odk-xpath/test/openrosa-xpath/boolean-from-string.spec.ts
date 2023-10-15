import { beforeEach, describe, it } from 'vitest';
import type { TestContext } from '../helpers.ts';
import { createTestContext } from '../helpers.ts';

describe('#boolean-from-string()', () => {
	let testContext: TestContext;

	beforeEach(() => {
		testContext = createTestContext();
	});

	it('boolean-from-string()', () => {
		testContext.assertBooleanValue("boolean-from-string('')", false);
		testContext.assertBooleanValue('boolean-from-string(1)', true);
		testContext.assertBooleanValue('boolean-from-string(0)', false);
		testContext.assertBooleanValue("boolean-from-string('1')", true);
		testContext.assertBooleanValue("boolean-from-string('2')", false);
		testContext.assertBooleanValue("boolean-from-string('0')", false);
		testContext.assertBooleanValue("boolean-from-string('true')", true);
		testContext.assertBooleanValue("boolean-from-string('True')", false);
		testContext.assertBooleanValue("boolean-from-string('false')", false);
		testContext.assertBooleanValue("boolean-from-string('whatever')", false);
		testContext.assertBooleanValue("boolean-from-string('nonsense')", false);
		testContext.assertBooleanValue('boolean-from-string(1.0)', true);
		testContext.assertBooleanValue('boolean-from-string(1.0001)', false);
		testContext.assertBooleanValue('boolean-from-string(true())', true);
	});
});

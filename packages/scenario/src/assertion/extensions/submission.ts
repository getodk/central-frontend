import { assertUnknownArray } from '@getodk/common/lib/type-assertions/assertUnknownArray.ts';
import { assertUnknownObject } from '@getodk/common/lib/type-assertions/assertUnknownObject.ts';
import { getBlobText } from '@getodk/common/lib/web-compat/blob.ts';
import type { DeriveStaticVitestExpectExtension } from '@getodk/common/test/assertions/helpers.ts';
import {
	ArbitraryConditionExpectExtension,
	AsymmetricTypedExpectExtension,
	AsyncAsymmetricTypedExpectExtension,
	extendExpect,
	instanceAssertion,
} from '@getodk/common/test/assertions/helpers.ts';
import type { SimpleAssertionResult } from '@getodk/common/test/assertions/vitest/shared-extension-types.ts';
import type { AssertIs } from '@getodk/common/types/assertions/AssertIs.ts';
import type {
	SubmissionChunkedType,
	SubmissionData,
	SubmissionInstanceFile,
	SubmissionResult,
} from '@getodk/xforms-engine';
import { constants } from '@getodk/xforms-engine';
import { assert, expect } from 'vitest';
import { Scenario } from '../../jr/Scenario.ts';
import { ComparableXMLSerialization } from '../../serialization/ComparableXMLSerialization.ts';
import { assertString } from './shared-type-assertions.ts';

type AssertScenario = AssertIs<Scenario>;

const assertScenario: AssertScenario = (value) => {
	assert(value instanceof Scenario);
};

const compareSubmissionXML = (actual: string, expected: string): SimpleAssertionResult => {
	const comparableActual = new ComparableXMLSerialization(actual);
	const comparableExpected = new ComparableXMLSerialization(expected);

	return comparableActual.equals(comparableExpected);
};

const assertFormData: AssertIs<FormData> = instanceAssertion(FormData);

type AnySubmissionResult = SubmissionResult<SubmissionChunkedType>;

/**
 * Validating the full {@link SubmissionResult} type is fairly involved. We
 * check the basic object shape (expected keys present, gut check a few easy to
 * check property types), on the assumption that downstream assertions will fail
 * if the runtime and static types disagree.
 *
 * @todo If that assumption turns out to be wrong, it would make sense to do
 * more complete validation here, serving as a smoke test for all tests
 * exercising aspects of a prepared submission result.
 */
const assertSubmissionResult: AssertIs<AnySubmissionResult> = (value) => {
	assertUnknownObject(value);
	assertString(value.status);
	if (value.violations !== null) {
		assertUnknownArray(value.violations);
	}
	assertUnknownObject(value.definition);

	if (Array.isArray(value.data)) {
		value.data.forEach((item) => {
			assertFormData(item);
		});
	} else {
		assertFormData(value.data);
	}
};

const assertFile: AssertIs<File> = instanceAssertion(File);

const { SUBMISSION_INSTANCE_FILE_NAME, SUBMISSION_INSTANCE_FILE_TYPE } = constants;

const assertSubmissionInstanceFile: AssertIs<SubmissionInstanceFile> = (value) => {
	assertFile(value);

	if (value.name !== SUBMISSION_INSTANCE_FILE_NAME) {
		throw new Error(`Expected file named ${SUBMISSION_INSTANCE_FILE_NAME}, got ${value.name}`);
	}

	if (value.type !== SUBMISSION_INSTANCE_FILE_TYPE) {
		throw new Error(`Expected file of type ${SUBMISSION_INSTANCE_FILE_TYPE}, got ${value.type}`);
	}
};

type ChunkedSubmissionData = readonly [SubmissionData, ...SubmissionData[]];

const isChunkedSubmissionData = (
	data: ChunkedSubmissionData | SubmissionData
): data is ChunkedSubmissionData => {
	return Array.isArray(data);
};

const getSubmissionData = (submissionResult: AnySubmissionResult): SubmissionData => {
	const { data } = submissionResult;

	if (isChunkedSubmissionData(data)) {
		const [first] = data;

		return first;
	}

	return data;
};

const getSubmissionInstanceFile = (
	submissionResult: AnySubmissionResult
): SubmissionInstanceFile => {
	const submissionData = getSubmissionData(submissionResult);
	const file = submissionData.get(SUBMISSION_INSTANCE_FILE_NAME);

	assertSubmissionInstanceFile(file);

	return file;
};

export const submissionExtensions = extendExpect(expect, {
	toHaveSerializedSubmissionXML: new AsymmetricTypedExpectExtension(
		assertScenario,
		assertString,
		(actual, expected) => {
			const actualXML = actual.proposed_serializeInstance();

			return compareSubmissionXML(actualXML, expected);
		}
	),

	toBeReadyForSubmission: new ArbitraryConditionExpectExtension(
		assertSubmissionResult,
		(result) => {
			try {
				expect(result).toMatchObject({
					status: 'ready',
					violations: null,
				});

				return true;
			} catch (error) {
				if (error instanceof Error) {
					return error;
				}

				// eslint-disable-next-line no-console
				console.error(error);
				return new Error('Unknown error');
			}
		}
	),

	toBePendingSubmissionWithViolations: new ArbitraryConditionExpectExtension(
		assertSubmissionResult,
		(result) => {
			try {
				expect(result.status).toBe('pending');
				expect(result.violations).toMatchObject([expect.any(Object)]);
				expect(result).toMatchObject({
					status: 'pending',
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					violations: expect.arrayContaining([expect.any(Object)]),
				});

				return true;
			} catch (error) {
				if (error instanceof Error) {
					return error;
				}

				// eslint-disable-next-line no-console
				console.error(error);
				return new Error('Unknown error');
			}
		}
	),

	toHavePreparedSubmissionXML: new AsyncAsymmetricTypedExpectExtension(
		assertSubmissionResult,
		assertString,
		async (actual, expected): Promise<SimpleAssertionResult> => {
			const instanceFile = getSubmissionInstanceFile(actual);
			const actualText = await getBlobText(instanceFile);

			return compareSubmissionXML(actualText, expected);
		}
	),
});

type SubmissionExtensions = typeof submissionExtensions;

declare module 'vitest' {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	interface Assertion<T = any> extends DeriveStaticVitestExpectExtension<SubmissionExtensions, T> {}
	interface AsymmetricMatchersContaining
		extends DeriveStaticVitestExpectExtension<SubmissionExtensions> {}
}

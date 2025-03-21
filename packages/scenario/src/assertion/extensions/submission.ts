import { PRELOAD_UID_PATTERN } from '@getodk/common/constants/regex.ts';
import {
	OPENROSA_XFORMS_NAMESPACE_URI,
	XFORMS_NAMESPACE_URI,
} from '@getodk/common/constants/xmlns.ts';
import { assertUnknownArray } from '@getodk/common/lib/type-assertions/assertUnknownArray.ts';
import { assertUnknownObject } from '@getodk/common/lib/type-assertions/assertUnknownObject.ts';
import { getBlobText } from '@getodk/common/lib/web-compat/blob.ts';
import type * as CommonAssertionHelpers from '@getodk/common/test/assertions/helpers.ts';
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
import type { ExpandUnion } from '@getodk/common/types/helpers.js';
import type { InstanceFile, InstancePayload, InstancePayloadType } from '@getodk/xforms-engine';
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

type AnyInstancePayload = InstancePayload<InstancePayloadType>;

/**
 * Validating the full {@link InstancePayload} type is fairly involved. We
 * check the basic object shape (expected keys present, gut check a few easy to
 * check property types), on the assumption that downstream assertions will fail
 * if the runtime and static types disagree.
 *
 * @todo If that assumption turns out to be wrong, it would make sense to do
 * more complete validation here, serving as a smoke test for all tests
 * exercising aspects of a prepared submission result.
 */
const assertInstancePayload: AssertIs<AnyInstancePayload> = (value) => {
	assertUnknownObject(value);
	assertString(value.status);
	if (value.violations !== null) {
		assertUnknownArray(value.violations);
	}
	assertUnknownObject(value.submissionMeta);

	if (Array.isArray(value.data)) {
		value.data.forEach((item) => {
			assertFormData(item);
		});
	} else {
		assertFormData(value.data);
	}
};

const assertFile: AssertIs<File> = instanceAssertion(File);

const { INSTANCE_FILE_NAME, INSTANCE_FILE_TYPE } = constants;

const assertInstanceFile: AssertIs<InstanceFile> = (value) => {
	assertFile(value);

	if (value.name !== INSTANCE_FILE_NAME) {
		throw new Error(`Expected file named ${INSTANCE_FILE_NAME}, got ${value.name}`);
	}

	if (value.type !== INSTANCE_FILE_TYPE) {
		throw new Error(`Expected file of type ${INSTANCE_FILE_TYPE}, got ${value.type}`);
	}
};

const getInstanceFile = (payload: AnyInstancePayload): InstanceFile => {
	const [instanceData] = payload.data;
	const file = instanceData.get(INSTANCE_FILE_NAME);

	assertInstanceFile(file);

	return file;
};

const META_NAMESPACE_URIS = [OPENROSA_XFORMS_NAMESPACE_URI, XFORMS_NAMESPACE_URI] as const;

type MetaNamespaceURI = (typeof META_NAMESPACE_URIS)[number];

type AssertEnumeratedString<T extends string> = (actual: unknown) => asserts actual is T;

/**
 * @todo This is probably general enough to be exported from {@link CommonAssertionHelpers}
 */
const enumeratedStringAssertion = <T extends string>(
	expected: readonly T[]
): AssertEnumeratedString<T> => {
	return (actual) => {
		assertString(actual);

		expect(expected).toContain(actual);
	};
};

const assertMetaNamespaceURI: AssertEnumeratedString<MetaNamespaceURI> =
	enumeratedStringAssertion(META_NAMESPACE_URIS);

interface SerializedMetaChildValues {
	readonly instanceID: string | null;
	readonly deprecatedID: string | null;
}

type MetaChildLocalName = ExpandUnion<keyof SerializedMetaChildValues>;

interface SerializedMeta extends SerializedMetaChildValues {
	readonly meta: Element | null;
}

type MetaElementLocalName = ExpandUnion<keyof SerializedMeta>;

/**
 * @todo this is general enough to go in `common` package, and would probably
 * find reuse pretty quickly. Holding off for now because it has overlap with
 * several even more general tuple-length narrowing cases:
 *
 * - Unbounded length -> 1-ary tuple
 * - Unbounded length -> parameterized N-ary tuple
 * - Unbounded length -> partially bounded (min-N, max-N) tuple
 * - Type guards (predicate) and `asserts` equivalents of each
 *
 * Each of these cases comes up frequently! I've written them at least a few
 * dozen times, and always back out to more specific logic for pragmatic
 * reasons. But having these generalizations would allow pretty significant
 * simplification of a lot of their use cases.
 */
const findExclusiveMatch = <T>(
	values: readonly T[],
	predicate: (value: T) => boolean
): T | null => {
	const results = values.filter(predicate);

	expect(results.length).toBeLessThanOrEqual(1);

	return results[0] ?? null;
};

const getMetaElement = (
	parent: ParentNode | null,
	namespaceURI: MetaNamespaceURI,
	localName: MetaElementLocalName
): Element | null => {
	if (parent == null) {
		return null;
	}

	const children = Array.from(parent.children);

	return findExclusiveMatch(children, (child) => {
		return child.namespaceURI === namespaceURI && child.localName === localName;
	});
};

const getMetaChildValue = (
	metaElement: Element | null,
	namespaceURI: MetaNamespaceURI,
	localName: MetaChildLocalName
): string | null => {
	const element = getMetaElement(metaElement, namespaceURI, localName);

	if (element == null) {
		return null;
	}

	expect(element.childElementCount).toBe(0);

	const { textContent } = element;

	assert(typeof textContent === 'string');

	return textContent;
};

interface MetaNamespaceOptions {
	readonly [key: string]: unknown;
	readonly metaNamespaceURI: MetaNamespaceURI;
}

type AssertMetaNamespaceOptions = (value: unknown) => asserts value is MetaNamespaceOptions;

const assertMetaNamespaceOptions: AssertMetaNamespaceOptions = (value) => {
	assertUnknownObject(value);
	assertMetaNamespaceURI(value.metaNamespaceURI);
};

const getSerializedMeta = (scenario: Scenario, namespaceURI: MetaNamespaceURI): SerializedMeta => {
	const serializedInstanceBody = scenario.proposed_serializeInstance();
	/**
	 * Important: we intentionally omit the default namespace when serializing instance XML. We need to restore it here to reliably traverse nodes when {@link metaNamespaceURI} is {@link XFORMS_NAMESPACE_URI}.
	 */
	const instanceXML = `<instance xmlns="${XFORMS_NAMESPACE_URI}">${serializedInstanceBody}</instance>`;

	const parser = new DOMParser();
	const instanceDocument = parser.parseFromString(instanceXML, 'text/xml');
	const instanceElement = instanceDocument.documentElement;
	const instanceRoot = instanceElement.firstElementChild;

	assert(
		instanceRoot != null,
		`Failed to find instance root element.\n\nActual serialized XML: ${serializedInstanceBody}\n\nActual instance DOM state: ${instanceElement.outerHTML}`
	);

	const meta = getMetaElement(instanceRoot, namespaceURI, 'meta');
	const instanceID = getMetaChildValue(meta, namespaceURI, 'instanceID');
	const deprecatedID = getMetaChildValue(meta, namespaceURI, 'deprecatedID');

	return {
		meta,
		instanceID,
		deprecatedID,
	};
};

const assertPreloadUIDValue = (actual: string | null) => {
	assert(actual != null, 'Expected preload uid value to be serialized');
	expect(actual, 'Expected preload uid value to match pattern').toMatch(PRELOAD_UID_PATTERN);
};

interface EditedMetaOptions extends MetaNamespaceOptions {
	readonly sourceScenario: Scenario;
}

type AssertEditedMetaOptions = (value: unknown) => asserts value is EditedMetaOptions;

const assertEditedMetaOptions: AssertEditedMetaOptions = (value) => {
	assertMetaNamespaceOptions(value);
	assertScenario(value.sourceScenario);
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

	toBeReadyForSubmission: new ArbitraryConditionExpectExtension(assertInstancePayload, (result) => {
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
	}),

	toBePendingSubmissionWithViolations: new ArbitraryConditionExpectExtension(
		assertInstancePayload,
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
		assertInstancePayload,
		assertString,
		async (actual, expected): Promise<SimpleAssertionResult> => {
			const instanceFile = getInstanceFile(actual);
			const actualText = await getBlobText(instanceFile);

			return compareSubmissionXML(actualText, expected);
		}
	),

	toHaveComputedPreloadInstanceID: new AsymmetricTypedExpectExtension(
		assertScenario,
		assertMetaNamespaceOptions,
		(scenario, options): SimpleAssertionResult => {
			try {
				const meta = getSerializedMeta(scenario, options.metaNamespaceURI);

				assertPreloadUIDValue(meta.instanceID);

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

	toHaveEditedPreloadInstanceID: new AsymmetricTypedExpectExtension(
		assertScenario,
		assertEditedMetaOptions,
		(editedScenario, options): SimpleAssertionResult => {
			try {
				const { metaNamespaceURI, sourceScenario } = options;
				const sourceMeta = getSerializedMeta(sourceScenario, metaNamespaceURI);
				const editedMeta = getSerializedMeta(editedScenario, metaNamespaceURI);

				assertPreloadUIDValue(sourceMeta.instanceID);
				assertPreloadUIDValue(editedMeta.instanceID);

				expect(
					editedMeta.instanceID,
					'Expected preloaded instanceID metadata to be recomputed on edit'
				).not.toBe(sourceMeta.instanceID);

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

	toHaveDeprecatedIDFromSource: new AsymmetricTypedExpectExtension(
		assertScenario,
		assertEditedMetaOptions,
		(editedScenario, options): SimpleAssertionResult => {
			try {
				const { metaNamespaceURI, sourceScenario } = options;
				const sourceMeta = getSerializedMeta(sourceScenario, metaNamespaceURI);
				const editedMeta = getSerializedMeta(editedScenario, metaNamespaceURI);

				assertPreloadUIDValue(sourceMeta.instanceID);
				assertPreloadUIDValue(editedMeta.deprecatedID);

				expect(
					editedMeta.deprecatedID,
					'Expected edited deprecatedID metadata to be assigned from source instanceID'
				).toBe(sourceMeta.instanceID);

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
});

type SubmissionExtensions = typeof submissionExtensions;

declare module 'vitest' {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	interface Assertion<T = any> extends DeriveStaticVitestExpectExtension<SubmissionExtensions, T> {}
	interface AsymmetricMatchersContaining
		extends DeriveStaticVitestExpectExtension<SubmissionExtensions> {}
}

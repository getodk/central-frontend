import { PRELOAD_UID_PATTERN } from '@getodk/common/constants/regex.ts';
import {
	OPENROSA_XFORMS_NAMESPACE_URI,
	OPENROSA_XFORMS_PREFIX,
	XFORMS_NAMESPACE_URI,
} from '@getodk/common/constants/xmlns.ts';
import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
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
import type { FormInstanceEditMode, FormInstanceRestoreMode } from '@getodk/xforms-engine';
import { assert, beforeEach, describe, expect, it } from 'vitest';
import { getNodeForReference } from '../src/client/traversal.ts';
import { Scenario } from '../src/jr/Scenario.ts';

/**
 * Note: this suite exercises edit-specific semantics which go beyond the shared
 * semantics of {@link FormInstanceRestoreMode | restore} and
 * {@link FormInstanceEditMode | edit}.
 *
 * @see {@link ./instance-input.test.ts} for coverage of general deserialization
 * concerns, which are tested for both "restore" and "edit" initialization
 * modes; and for I/O which is exercised as a prerequisite for the "edit" subset
 * of that suite.
 */
describe('Instance edit semantics', () => {
	type MetaNamespacePrefix = OPENROSA_XFORMS_PREFIX | null;

	interface NodeReferenceOptions {
		readonly prefix?: string | null;
		readonly parentReference?: NodeReference;
	}

	interface NodeReference {
		readonly prefix: string | null;
		readonly name: string;
		readonly path: string;
	}

	const prefixName = (prefix: string | null, localName: string) => {
		if (prefix == null) {
			return localName;
		}

		return `${prefix}:${localName}`;
	};

	const nodeReference = (localName: string, options: NodeReferenceOptions = {}): NodeReference => {
		const { prefix = options.parentReference?.prefix ?? null } = options;
		const name = prefixName(prefix ?? null, localName);
		const pathPrefix = options.parentReference?.path ?? '';

		return {
			prefix,
			name,
			path: `${pathPrefix}/${name}`,
		};
	};

	type MetaNamespaceURI = OPENROSA_XFORMS_NAMESPACE_URI | XFORMS_NAMESPACE_URI;

	const getMetaNamespaceURI = (metaPrefix: MetaNamespacePrefix): MetaNamespaceURI => {
		switch (metaPrefix) {
			case 'orx':
				return OPENROSA_XFORMS_NAMESPACE_URI;

			case null:
				return XFORMS_NAMESPACE_URI;

			default:
				throw new UnreachableError(metaPrefix);
		}
	};

	interface SimpleEditCase {
		readonly metaPrefix: MetaNamespacePrefix;
		readonly metaNamespaceURI: MetaNamespaceURI;
		readonly root: NodeReference;
		readonly meta: NodeReference;
		readonly instanceID: NodeReference;
		readonly deprecatedID: NodeReference;
	}

	interface SimpleEditCaseOptions {
		readonly metaPrefix: MetaNamespacePrefix;
	}

	const simpleEditCase = ({ metaPrefix }: SimpleEditCaseOptions): SimpleEditCase => {
		const metaNamespaceURI = getMetaNamespaceURI(metaPrefix);
		const root = nodeReference('data');
		const meta = nodeReference('meta', {
			prefix: metaPrefix,
			parentReference: root,
		});
		const instanceID = nodeReference('instanceID', {
			parentReference: meta,
		});
		const deprecatedID = nodeReference('deprecatedID', {
			parentReference: meta,
		});

		return {
			metaNamespaceURI,
			metaPrefix,
			root,
			meta,
			instanceID,
			deprecatedID,
		};
	};

	const simpleEditScenario = async (options: SimpleEditCase): Promise<Scenario> => {
		const { root, meta, instanceID } = options;

		// prettier-ignore
		return Scenario.init('Edit deprecatedID metadata',
			html(
				head(
					title('Edit deprecatedID metadata'),
					model(
						mainInstance(
							t(`${root.name} id="edit-deprecatedID-metadata"`,
								t('a'),
								t(meta.name,
									t(instanceID.name)))),
						bind('/data/a').type('string'),
						bind(instanceID.path).preload('uid'))
				),
				body(input('/data/a'))));
	};

	const getMetaValue = (scenario: Scenario, reference: NodeReference): string => {
		const node = scenario.getInstanceNode(reference.path);

		assert(node.nodeType === 'input' || node.nodeType === 'model-value');
		assert(node.valueType === 'string');

		return node.currentState.value;
	};

	const getOptionalMetaValue = (scenario: Scenario, reference: NodeReference): string | null => {
		const node = getNodeForReference(scenario.instanceRoot, reference.path);

		if (node == null) {
			return null;
		}

		assert(node.nodeType === 'input' || node.nodeType === 'model-value');
		assert(node.valueType === 'string');

		const { value } = node.currentState;

		if (value === '') {
			return null;
		}

		return value;
	};

	describe('deprecatedID metadata', () => {
		describe.each<SimpleEditCase>([
			simpleEditCase({ metaPrefix: OPENROSA_XFORMS_PREFIX }),
			simpleEditCase({ metaPrefix: null }),
		])('metadata namespace prefix: $metaPrefix', (caseOptions) => {
			const { instanceID, deprecatedID } = caseOptions;

			it(`populates ${deprecatedID.path} with the input value of ${instanceID.path}`, async () => {
				const scenario = await simpleEditScenario(caseOptions);
				const sourceInstanceID = getMetaValue(scenario, instanceID);

				// Prerequisite
				expect(sourceInstanceID).toMatch(PRELOAD_UID_PATTERN);

				const edited = await scenario.proposed_editCurrentInstanceState();
				const editedDeprecatedID = getMetaValue(edited, deprecatedID);

				expect(editedDeprecatedID).toBe(sourceInstanceID);
			});

			it(`serializes ${deprecatedID.path} with the input value of ${instanceID.path}`, async () => {
				const sourceScenario = await simpleEditScenario(caseOptions);
				const edited = await sourceScenario.proposed_editCurrentInstanceState();

				expect(edited).toHaveDeprecatedIDFromSource({
					sourceScenario,
					metaNamespaceURI: caseOptions.metaNamespaceURI,
				});
			});
		});
	});

	describe('instanceID metadata', () => {
		describe.each<SimpleEditCase>([
			simpleEditCase({ metaPrefix: OPENROSA_XFORMS_PREFIX }),
			simpleEditCase({ metaPrefix: null }),
		])('metadata namespace prefix: $metaPrefix', (caseOptions) => {
			it('recomputes instanceID', async () => {
				const sourceScenario = await simpleEditScenario(caseOptions);
				const edited = await sourceScenario.proposed_editCurrentInstanceState();

				expect(edited).toHaveEditedPreloadInstanceID({
					sourceScenario,
					metaNamespaceURI: caseOptions.metaNamespaceURI,
				});
			});
		});
	});

	describe('chained instance references', () => {
		describe.each<SimpleEditCase>([
			simpleEditCase({ metaPrefix: OPENROSA_XFORMS_PREFIX }),
			simpleEditCase({ metaPrefix: null }),
		])('metadata namespace prefix: $metaPrefix', (caseOptions) => {
			const { metaNamespaceURI } = caseOptions;

			interface ChainedEditScenarios {
				readonly source: Scenario;
				readonly edit1: Scenario;
				readonly edit2: Scenario;
			}

			let scenarios: ChainedEditScenarios;

			beforeEach(async () => {
				const source = await simpleEditScenario(caseOptions);
				const edit1 = await source.proposed_editCurrentInstanceState();
				const edit2 = await edit1.proposed_editCurrentInstanceState();

				scenarios = {
					source,
					edit1,
					edit2,
				};
			});

			type ChainingAssertion = (source: Scenario, edited: Scenario) => void;

			/**
			 * This condenses the basic assertions of both edit-specific semantics:
			 *
			 * - before `instanceID` -> after `deprecatedID`
			 * - recomputed `preload="uid"`  -> after `instanceID`
			 *
			 * Note: assertion at depth 2 in a chain of edits effectively exercises
			 * overwrite of the previous edit's `deprecatedID` value, rather than
			 * naively appending multiple `deprecatedID` elements.
			 */
			const chainingConditions: readonly ChainingAssertion[] = [
				(source, edited) => {
					expect(edited).toHaveDeprecatedIDFromSource({
						metaNamespaceURI,
						sourceScenario: source,
					});
				},

				(source, edited) => {
					expect(edited).toHaveEditedPreloadInstanceID({
						metaNamespaceURI,
						sourceScenario: source,
					});
				},
			];

			const assertChained = (source: Scenario, edited: Scenario) => {
				for (const assertCondition of chainingConditions) {
					assertCondition(source, edited);
				}
			};

			/**
			 * Tests that the chaining exercised by {@link assertChained} does not
			 * apply to instances {@link a} and {@link b}, in either ordering, by
			 * asserting that at least one of the chaining conditions fails.
			 */
			const assertNotChained = (a: Scenario, b: Scenario) => {
				const orderings = [
					[a, b],
					[b, a],
				] as const;

				let assertionFailure: unknown = null;

				for (const ordering of orderings) {
					const [source, edited] = ordering;

					for (const assertCondition of chainingConditions) {
						if (assertionFailure != null) {
							break;
						}

						try {
							assertCondition(source, edited);
						} catch (error) {
							assertionFailure = error;
						}
					}
				}

				expect(assertionFailure).toBeInstanceOf(Error);
			};

			// Typical pattern: chained sequential edits form a linked list
			it('creates a chain of edited deprecatedID -> source instanceID references over subsequent edits', () => {
				const { source, edit1, edit2 } = scenarios;

				// Prerequisite
				assertChained(source, edit1);

				// Sanity/meaningfulness of test: edit2 is not chained from source
				assertNotChained(source, edit2);

				// Assert: edit2 is chained from edit1
				assertChained(edit1, edit2);
			});

			// Spec design/intent: chained branched edits form a tree
			it('creates a tree of edited deprecatedID -> source instanceID references over subsequent edits of a common ancestor instance', async () => {
				const { source, edit1: branch1, edit2: leaf1 } = scenarios;

				const branch2 = await source.proposed_editCurrentInstanceState();
				const leaf2 = await branch2.proposed_editCurrentInstanceState();

				assertChained(source, branch1);
				assertChained(source, branch2);
				assertChained(branch1, leaf1);
				assertChained(branch2, leaf2);

				assertNotChained(branch1, leaf2);
				assertNotChained(branch2, leaf1);
			});
		});
	});

	/**
	 * However weird it might be to test "restore" behavior _in the edit-specific
	 * suite_... the intent is to document that the behaviors under test are
	 * **exclusive** to editing. Otherwise understanding of this semantic
	 * distinction could more easily fade or become confused over time, leaving
	 * future contributors (including our future selves) to intuit that their main
	 * distinction is I/O (as their distinct interfaces might imply).
	 */
	describe('as distinct from instance restore semantics', () => {
		describe.each<SimpleEditCase>([
			simpleEditCase({ metaPrefix: OPENROSA_XFORMS_PREFIX }),
			simpleEditCase({ metaPrefix: null }),
		])('metadata namespace prefix: $metaPrefix', (caseOptions) => {
			const { instanceID, deprecatedID } = caseOptions;

			it('does not recompute instanceID on restore', async () => {
				const sourceScenario = await simpleEditScenario(caseOptions);
				const restored = await sourceScenario.proposed_serializeAndRestoreInstanceState();

				expect(restored).not.toHaveEditedPreloadInstanceID({
					sourceScenario,
					metaNamespaceURI: caseOptions.metaNamespaceURI,
				});
			});

			it('does not populate deprecatedID on restore', async () => {
				const sourceScenario = await simpleEditScenario(caseOptions);
				const sourceInstanceID = getMetaValue(sourceScenario, instanceID);
				const restored = await sourceScenario.proposed_serializeAndRestoreInstanceState();
				const restoredDeprecatedID = getOptionalMetaValue(restored, deprecatedID);

				expect(restoredDeprecatedID).not.toBe(sourceInstanceID);
				expect(restoredDeprecatedID).toBeNull();

				expect(restored).not.toHaveDeprecatedIDFromSource({
					sourceScenario,
					metaNamespaceURI: caseOptions.metaNamespaceURI,
				});
			});
		});
	});
});

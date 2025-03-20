import { PRELOAD_UID_PATTERN } from '@getodk/common/constants/regex.ts';
import { OPENROSA_XFORMS_PREFIX } from '@getodk/common/constants/xmlns.ts';
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
import { assert, describe, expect, it } from 'vitest';
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
	type MetadataNamespacePrefix = OPENROSA_XFORMS_PREFIX | null;

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

	interface SimpleEditCase {
		readonly metaPrefix: MetadataNamespacePrefix;
		readonly root: NodeReference;
		readonly meta: NodeReference;
		readonly instanceID: NodeReference;
		readonly deprecatedID: NodeReference;
	}

	interface SimpleEditCaseOptions {
		readonly metaPrefix: MetadataNamespacePrefix;
	}

	const simpleEditCase = ({ metaPrefix }: SimpleEditCaseOptions): SimpleEditCase => {
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

	describe('deprecatedID metadata', () => {
		describe.each<SimpleEditCase>([
			simpleEditCase({ metaPrefix: OPENROSA_XFORMS_PREFIX }),
			simpleEditCase({ metaPrefix: null }),
		])('metadata namespace prefix: $metaPrefix', (caseOptions) => {
			const { instanceID, deprecatedID } = caseOptions;

			const getMetaValue = (scenario: Scenario, reference: NodeReference): string => {
				const node = scenario.getInstanceNode(reference.path);

				assert(node.nodeType === 'input' || node.nodeType === 'model-value');
				assert(node.valueType === 'string');

				return node.currentState.value;
			};

			it(`populates ${deprecatedID.path} with the input value of ${instanceID.path}`, async () => {
				const scenario = await simpleEditScenario(caseOptions);
				const sourceInstanceID = getMetaValue(scenario, instanceID);

				// Prerequisite
				expect(sourceInstanceID).toMatch(PRELOAD_UID_PATTERN);

				const edited = await scenario.proposed_editCurrentInstanceState();
				const editedDeprecatedID = getMetaValue(edited, deprecatedID);

				expect(editedDeprecatedID).toBe(sourceInstanceID);
			});
		});
	});
});

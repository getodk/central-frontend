import { OPENROSA_XFORMS_NAMESPACE_URI } from '@getodk/common/constants/xmlns.ts';
import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import type { XFormsElement } from '@getodk/common/test/fixtures/xform-dsl/XFormsElement.ts';
import {
	bind,
	body,
	group,
	head,
	html,
	input,
	label,
	mainInstance,
	model,
	repeat,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import type {
	InstanceData,
	InstanceFile,
	LoadFormWarnings,
	RestoreFormInstanceInput,
} from '@getodk/xforms-engine';
import { constants } from '@getodk/xforms-engine';
import type { MockInstance } from 'vitest';
import { afterEach, assert, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComparableAnswer } from '../src/answer/ComparableAnswer.ts';
import { intAnswer } from '../src/answer/ExpectedIntAnswer.ts';
import { stringAnswer } from '../src/answer/ExpectedStringAnswer.ts';
import { Scenario } from '../src/jr/Scenario.ts';

type InstanceRoundTripInitializationMode = 'edit' | 'restore';

interface InstanceRoundTripCase {
	readonly initializationMode: InstanceRoundTripInitializationMode;
}

describe.each<InstanceRoundTripCase>([
	{ initializationMode: 'restore' },
	{ initializationMode: 'edit' },
])('Instance input (deserialization) - mode: $initializationMode', ({ initializationMode }) => {
	const scenarioFromCurrentInstanceState = async (scenario: Scenario): Promise<Scenario> => {
		switch (initializationMode) {
			case 'edit':
				return scenario.proposed_editCurrentInstanceState();

			case 'restore':
				return scenario.proposed_serializeAndRestoreInstanceState();

			default:
				throw new UnreachableError(initializationMode);
		}
	};

	let cleanupCallbacks = Array<VoidFunction>();

	class WarningTracker {
		private readonly mock: MockInstance;
		private readonly initialCallCount: number;

		constructor() {
			this.mock = vi.spyOn(console, 'warn');
			this.initialCallCount = this.mock.mock.calls.length;

			cleanupCallbacks.push(() => {
				this.mock.mockRestore();
			});
		}

		/**
		 * @todo when we actually design a way to convey
		 * {@link LoadFormWarnings | warnings} from the engine, this isn't
		 * even remotely how we'll do it or test for it!
		 */
		assertExcessRepeatInstanceWarningProduced(): void {
			expect(this.mock).toHaveBeenCalledTimes(this.initialCallCount + 1);
		}
	}

	const { INSTANCE_FILE_NAME, INSTANCE_FILE_TYPE } = constants;

	class FabricatedInstanceFile extends File implements InstanceFile {
		override readonly name = INSTANCE_FILE_NAME;
		override readonly type = INSTANCE_FILE_TYPE;

		constructor(instanceElement: XFormsElement) {
			super([instanceElement.asXml()], INSTANCE_FILE_NAME);
		}
	}

	type AssertInstanceData = (data: FormData) => asserts data is InstanceData;

	const assertInstanceData: AssertInstanceData = (data) => {
		const instanceFile = data.get(INSTANCE_FILE_NAME);

		expect(instanceFile).toBeInstanceOf(FabricatedInstanceFile);
	};

	const fabricateInstanceInput = (instanceElement: XFormsElement): RestoreFormInstanceInput => {
		const instanceFile = new FabricatedInstanceFile(instanceElement);
		const instanceData = new FormData();

		instanceData.set(INSTANCE_FILE_NAME, instanceFile);

		assertInstanceData(instanceData);

		return {
			data: [instanceData],
		};
	};

	afterEach(() => {
		for (const callback of cleanupCallbacks) {
			callback();
		}

		cleanupCallbacks = [];
	});

	/**
	 * Note: this is _implicitly covered_ by tests exercising less basic concepts,
	 * e.g. restoration of non-relevant nodes. Is there any value (maybe social?)
	 * in explicitly testing basics here?
	 */
	describe.skip('basic restoration of instance state');

	describe('instance id', () => {
		const FORM_DEFINED_INSTANCE_ID = 'restore-instance-id';

		interface InvalidInstanceIdCase {
			readonly instanceId: string | null;
		}

		it.each<InvalidInstanceIdCase>([
			{ instanceId: `__WRONG_INSTANCE_ID__${FORM_DEFINED_INSTANCE_ID}__WRONG_INSTANCE_ID__` },
			{ instanceId: null },
		])(
			`produces an error on attempt to restore an instance (id: $instanceId) for form (id: ${FORM_DEFINED_INSTANCE_ID})`,
			async ({ instanceId }) => {
				// prettier-ignore
				const scenario = await Scenario.init('Restore instance id', html(
				head(
					title('Restore instance id'),
					model(
						mainInstance(
							t(`data id="${FORM_DEFINED_INSTANCE_ID}"`,
								t('meta', t('instanceID')))
						),
						bind('/data/meta/instanceID').preload('uid')
					)
				),
				body()
			));

				let serializedInput: XFormsElement;

				if (instanceId == null) {
					serializedInput =
						// prettier-ignore
						t(`data`,
							t('meta',
								t('instanceID', 'does not matter for this test')));
				} else {
					serializedInput =
						// prettier-ignore
						t(`data id="${instanceId}"`,
							t('meta',
								t('instanceID', 'does not matter for this test')));
				}

				const instanceInput = fabricateInstanceInput(serializedInput);

				let caught: Error | null = null;

				try {
					await scenario.restoreWebFormsInstanceState(instanceInput);
				} catch (error) {
					assert(error instanceof Error);
					caught = error;
				}

				assert(
					caught instanceof Error,
					'Expected restoring instance to produce error for mismatch between form and instance `id`'
				);
			}
		);
	});

	describe('non-relevant nodes omitted from instance payload', () => {
		let scenario: Scenario;

		beforeEach(async () => {
			// prettier-ignore
			scenario = await Scenario.init('XML serialization - relevance', html(
					head(
						title('XML serialization - relevance'),
						model(
							mainInstance(
								t('data id="xml-serialization-relevance"',
									t('grp-rel', '1'),
									t('inp-rel', '1'),
									t('grp',
										t('inp', 'inp default value')),
										t('meta', t('instanceID')))
							),
							bind('/data/grp-rel'),
							bind('/data/inp-rel'),
							bind('/data/grp').relevant('/data/grp-rel = 1'),
							bind('/data/grp/inp').relevant('/data/inp-rel = 1'),
							bind('/data/meta/instanceID').preload('uid')
						)
					),
					body(
						input('/data/grp-rel',
							label('`grp` is relevant when this value is 1')),
						input('/data/inp-rel',
							label('`inp` is relevant when this value is 1')),
						group('/data/grp',
							label('grp'),

							input('/data/grp/inp',
								label('inp'))))
				));
		});

		it('restores an omitted leaf node as non-relevant', async () => {
			scenario.answer('/data/inp-rel', 0);

			// Sanity check precondition: non-relevant leaf node is blank
			expect(scenario.answerOf('/data/grp/inp')).toEqualAnswer(stringAnswer(''));

			const result = await scenarioFromCurrentInstanceState(scenario);

			// Assertion of non-relevance and blank value will fail if the node,
			// omitted as non-relevant from serialization, is not restored.
			expect(result.getInstanceNode('/data/grp/inp')).toBeNonRelevant();
			expect(result.answerOf('/data/grp/inp')).toEqualAnswer(stringAnswer(''));
		});

		it('restores a non-relevant leaf node with its model default value when it becomes relevant', async () => {
			// Sanity check precondition: relevant default value
			expect(scenario.answerOf('/data/grp/inp')).toEqualAnswer(stringAnswer('inp default value'));

			scenario.answer('/data/inp-rel', 0);

			// Sanity check precondition: non-relevant leaf node is blank
			expect(scenario.answerOf('/data/grp/inp')).toEqualAnswer(stringAnswer(''));

			const result = await scenarioFromCurrentInstanceState(scenario);

			// Sanity check precondition: node restored, continues to be
			// non-relevant (and blank)
			expect(result.getInstanceNode('/data/grp/inp')).toBeNonRelevant();
			expect(result.answerOf('/data/grp/inp')).toEqualAnswer(stringAnswer(''));

			result.answer('/data/inp-rel', 1);

			expect(result.getInstanceNode('/data/grp/inp')).toBeRelevant();
			expect(result.answerOf('/data/grp/inp')).toEqualAnswer(stringAnswer('inp default value'));
		});

		it('restores an omitted subtree node as non-relevant', async () => {
			scenario.answer('/data/grp-rel', 0);

			// Sanity check precondition: non-relevant leaf node is blank
			expect(scenario.answerOf('/data/grp/inp')).toEqualAnswer(stringAnswer(''));

			const result = await scenarioFromCurrentInstanceState(scenario);

			expect(result.getInstanceNode('/data/grp')).toBeNonRelevant();
		});

		it("restores a non-relevant subtree node's descendant leaf node with its model default value when the restored subtree becomes relevant", async () => {
			// Sanity check precondition: relevant default value
			expect(scenario.answerOf('/data/grp/inp')).toEqualAnswer(stringAnswer('inp default value'));

			scenario.answer('/data/grp-rel', 0);

			// Sanity check precondition: subtree non-relevant, descendant blank by
			// inheriting non-relevance
			expect(scenario.getInstanceNode('/data/grp')).toBeNonRelevant();
			expect(scenario.answerOf('/data/grp/inp')).toEqualAnswer(stringAnswer(''));

			const result = await scenarioFromCurrentInstanceState(scenario);

			// Sanity check precondition: node restored, continues to be non-relevant,
			// descendant leaf node is still blank
			expect(result.getInstanceNode('/data/grp')).toBeNonRelevant();
			expect(result.answerOf('/data/grp/inp')).toEqualAnswer(stringAnswer(''));

			result.answer('/data/grp-rel', 1);

			// Once restored subtree node is relevant, descendant leaf node is
			// restored with the model-defined default for that node
			expect(result.getInstanceNode('/data/grp')).toBeRelevant();
			expect(result.answerOf('/data/grp/inp')).toEqualAnswer(stringAnswer('inp default value'));
		});
	});

	/**
	 * **PORTING NOTES**
	 *
	 * Writing these tests to determine the current behavior or compare with
	 * JavaRosa's behavior has been deferred, per request by @lognaturel.
	 *
	 * **OPEN QUESTION**
	 *
	 * Given:
	 *
	 * 1. A form defined with a `relevant` expression
	 * 2. A serialized instance where:
	 *     - that `relevant` expression would evaluate to `false`
	 *     - the non-relevant node has been serialized with a value different from
	 *       its model default
	 * 3. Form instance state is restored from that instance
	 * 4. A state change is made to make the previously non-relevant node become
	 *    relevant
	 *
	 * Should that node's value:
	 *
	 * - A: be restored from the instance-serialized value; OR
	 * - B: be restored from the model-defined default value; OR
	 * - C: either/both depending on other circumstances, e.g.
	 *     - edit -> B
	 *     - restore incomplete state -> A
	 *
	 * - - -
	 *
	 * **EDITORIAL**
	 *
	 * - Because testing this has been deferred, I can only speak to current
	 *   behavior based on my understanding having developed it. So I may be
	 *   mistaken, but I would expect the _current behavior_ to be A.
	 *
	 * - It would probably have been faster to write the tests and answer that
	 *   with more certainty. At least speaking for myself, it takes longer to
	 *   write prose than to mostly-copypasta and tweak some test code.
	 *
	 * - My instinct is that C (with its example) _feels like the right answer_.
	 *
	 * - Important to know: what is JavaRosa's behavior under the same
	 *   circumstances, and does/should deserialization intent influence it?
	 *
	 * - - -
	 *
	 * Note that the descriptions of each test in this sub-suite is derived from a
	 * corresponding equivalent, in the corresponding "omitted from instance
	 * payload" sub-suite above.
	 */
	describe('non-relevant nodes included in instance payload', () => {
		it.todo(
			'restores a non-relevant leaf node with [its model default value? the serialized node value? TBD!] when it becomes relevant'
		);

		it.todo(
			"restores a non-relevant subtree node's descendant leaf node with [its model default value? the serialized node value? TBD!] when the restored subtree becomes relevant"
		);
	});

	describe('calculate', () => {
		const IGNORED_INSTANCE_ID = 'ignored for purposes of functionality under test';

		let scenario: Scenario;

		beforeEach(async () => {
			scenario = await Scenario.init(
				'Calculate serde',
				// prettier-ignore
				html(
					head(
						title('Calculate serde'),
						model(
							mainInstance(
								t('data id="calculate-serde"',
									t('a', '2'),
									t('b'),
									t('c'),
									t('orx:meta',
										t('orx:instanceID', IGNORED_INSTANCE_ID)))),
							bind('/data/a').type('int'),
							bind('/data/b').type('int').calculate('/data/a * 3'),
							bind('/data/c').type('int').calculate('(/data/a + /data/b) * 5'))),
					body(
						input('/data/a', label('a')),
						input('/data/b', label('b')),
						input('/data/c', label('c'))))
			);

			// Sanity check default state
			expect(scenario.answerOf('/data/a')).toEqualAnswer(intAnswer(2));
			expect(scenario.answerOf('/data/b')).toEqualAnswer(intAnswer(6));
			expect(scenario.answerOf('/data/c')).toEqualAnswer(intAnswer(40));
		});

		it('restores calculated values', async () => {
			// Sanity check precondition: default values/calculations from same
			expect(scenario.answerOf('/data/a')).toEqualAnswer(intAnswer(2));
			expect(scenario.answerOf('/data/b')).toEqualAnswer(intAnswer(6));
			expect(scenario.answerOf('/data/c')).toEqualAnswer(intAnswer(40));

			scenario.answer('/data/a', 3);

			expect(scenario.answerOf('/data/a')).toEqualAnswer(intAnswer(3));
			expect(scenario.answerOf('/data/b')).toEqualAnswer(intAnswer(9));
			expect(scenario.answerOf('/data/c')).toEqualAnswer(intAnswer(60));

			const result = await scenarioFromCurrentInstanceState(scenario);

			expect(result.answerOf('/data/a')).toEqualAnswer(intAnswer(3));
			expect(result.answerOf('/data/b')).toEqualAnswer(intAnswer(9));
			expect(result.answerOf('/data/c')).toEqualAnswer(intAnswer(60));
		});

		/**
		 * @todo this should eventually be moved to {@link ./submission.test.ts}.
		 * It's here temporarily because it adds context for the next test,
		 * exercising recalculation of the same nodes **once restored** from
		 * serialized instance state.
		 *
		 * Specifically: when we fix the bug causing this test to fail, we'll want
		 * to revise _that test_ to restore _arbitrarily crafted instance XML_ with
		 * the same manually entered values... as if editing an instance which was
		 * submitted with this bug!
		 *
		 * @todo it also seems likely we can address this bug in the broader story
		 * for actions/events. For instnace, we might re-trigger `calculate` for
		 * nodes with stale/overwritten values based on some notion of
		 * {@link https://www.w3.org/TR/xforms/#evt-revalidate | xforms-revalidate}
		 * (which is explicitly linked by the ODK XForms spec, associated with
		 * {@link https://getodk.github.io/xforms-spec/#preload-attributes | preload attributes}
		 * for `jr:preload="timestamp" jr:preloadParams="timeEnd"`).
		 */
		it.fails('recalculates manually overwritten values before serializing state', async () => {
			scenario.answer('/data/a', 2);
			scenario.answer('/data/b', 2);
			scenario.answer('/data/c', 2);

			const payload = await scenario.prepareWebFormsInstancePayload();
			const instanceFile = payload.data[0].get(constants.INSTANCE_FILE_NAME);
			const instanceXML = await instanceFile.text();

			expect(instanceXML).toBe(
				t(
					`data xmlns:orx="${OPENROSA_XFORMS_NAMESPACE_URI}" id="calculate-serde"`,
					t('a', '2'),
					t('b', '6'),
					t('c', '40'),
					t('orx:meta', t('orx:instanceID', IGNORED_INSTANCE_ID))
				).asXml()
			);
		});

		/**
		 * @todo See notes on test directly above. When that test passes, this test
		 * will need to be updated to retain any meaning.
		 */
		it('recalculates, overwriting manually entered values', async () => {
			scenario.answer('/data/a', 2);
			scenario.answer('/data/b', 2);
			scenario.answer('/data/c', 2);

			const result = await scenarioFromCurrentInstanceState(scenario);

			expect(result.answerOf('/data/a')).toEqualAnswer(intAnswer(2));
			expect(result.answerOf('/data/b')).toEqualAnswer(intAnswer(6));
			expect(result.answerOf('/data/c')).toEqualAnswer(intAnswer(40));
		});
	});

	describe('repeats', () => {
		it('restores serialized repeat instance state', async () => {
			const scenario = await Scenario.init(
				'Repeat serde (basic + calculate)',
				// prettier-ignore
				html(
					head(
						title('Repeat serde (basic + calculate)'),
						model(
							mainInstance(t('data id="repeat-serde-basic-calculate"',
								t('repeat jr:template=""',
									t('inner1', '4'),
									t('inner2'),
									t('inner3')
								),
								t('repeat',
									t('inner1'),
									t('inner2'),
									t('inner3')
								))),
							bind('/data/repeat/inner2').calculate('2 * ../inner1'),
							bind('/data/repeat/inner3').calculate('2 * ../inner2'))),

					body(
						repeat('/data/repeat',
							input('/data/repeat/inner1',
								label('inner1')))))
			);

			scenario.next('/data/repeat[1]');
			scenario.next('/data/repeat[1]/inner1');
			scenario.answer('/data/repeat[1]/inner1', 3);
			scenario.next('/data/repeat');

			// Sanity check preconditions
			expect(scenario.answerOf('/data/repeat[1]/inner1')).toEqualAnswer(intAnswer(3));
			expect(scenario.answerOf('/data/repeat[1]/inner2')).toEqualAnswer(intAnswer(6));
			expect(scenario.answerOf('/data/repeat[1]/inner3')).toEqualAnswer(intAnswer(12));

			scenario.createNewRepeat({ assertCurrentReference: '/data/repeat' });

			// Sanity check preconditions (implicit, created repeat with template defaults)
			expect(scenario.answerOf('/data/repeat[2]/inner1')).toEqualAnswer(intAnswer(4));
			expect(scenario.answerOf('/data/repeat[2]/inner2')).toEqualAnswer(intAnswer(8));
			expect(scenario.answerOf('/data/repeat[2]/inner3')).toEqualAnswer(intAnswer(16));

			// Exercise restoration of repeats
			const result = await scenarioFromCurrentInstanceState(scenario);

			// Assert that same number of serialized repeat instances is restored
			expect(result.countRepeatInstancesOf('/data/repeat')).toBe(2);

			// Assert that written values are restored in each repeat instance
			expect(result.answerOf('/data/repeat[1]/inner1')).toEqualAnswer(intAnswer(3));
			expect(result.answerOf('/data/repeat[2]/inner1')).toEqualAnswer(intAnswer(4));

			// Assert that calculated values are restored as well
			expect(result.answerOf('/data/repeat[1]/inner2')).toEqualAnswer(intAnswer(6));
			expect(result.answerOf('/data/repeat[1]/inner3')).toEqualAnswer(intAnswer(12));
			expect(result.answerOf('/data/repeat[2]/inner2')).toEqualAnswer(intAnswer(8));
			expect(result.answerOf('/data/repeat[2]/inner3')).toEqualAnswer(intAnswer(16));
		});

		describe('jr:count', () => {
			let scenario: Scenario;

			beforeEach(async () => {
				scenario = await Scenario.init(
					'Repeat serde (count)',
					// prettier-ignore
					html(
						head(
							title('Repeat serde (count)'),
							model(
								mainInstance(t('data id="repeat-serde-count"',
									t('rep-count'),
									t('repeat jr:template=""',
										t('inner1'),
										t('inner2'),
										t('inner3')
									))),
								bind('/data/rep-count').type('int'),
								bind('/data/repeat/inner1').calculate('position(..)'),
								bind('/data/repeat/inner2').calculate('2 * ../inner1'),
								bind('/data/repeat/inner3').calculate('2 * ../inner2'))),

						body(
							input('/data/rep-count', label('Repeat count')),
							repeat('/data/repeat', '/data/rep-count',
								input('/data/repeat/inner1', label('inner1')))))
				);
			});

			it('restores count-controlled repeat instances in their state prior to serialization', async () => {
				scenario.answer('/data/rep-count', 2);

				// Sanity check preconditions
				expect(scenario.answerOf('/data/repeat[1]/inner1')).toEqualAnswer(intAnswer(1));
				expect(scenario.answerOf('/data/repeat[1]/inner2')).toEqualAnswer(intAnswer(2));
				expect(scenario.answerOf('/data/repeat[1]/inner3')).toEqualAnswer(intAnswer(4));
				expect(scenario.answerOf('/data/repeat[2]/inner1')).toEqualAnswer(intAnswer(2));
				expect(scenario.answerOf('/data/repeat[2]/inner2')).toEqualAnswer(intAnswer(4));
				expect(scenario.answerOf('/data/repeat[2]/inner3')).toEqualAnswer(intAnswer(8));

				const result = await scenarioFromCurrentInstanceState(scenario);

				expect(result.answerOf('/data/rep-count')).toEqualAnswer(intAnswer(2));
				expect(result.countRepeatInstancesOf('/data/repeat')).toBe(2);
				expect(result.answerOf('/data/repeat[1]/inner1')).toEqualAnswer(intAnswer(1));
				expect(result.answerOf('/data/repeat[1]/inner2')).toEqualAnswer(intAnswer(2));
				expect(result.answerOf('/data/repeat[1]/inner3')).toEqualAnswer(intAnswer(4));
				expect(result.answerOf('/data/repeat[2]/inner1')).toEqualAnswer(intAnswer(2));
				expect(result.answerOf('/data/repeat[2]/inner2')).toEqualAnswer(intAnswer(4));
				expect(result.answerOf('/data/repeat[2]/inner3')).toEqualAnswer(intAnswer(8));
			});

			interface MissingRepeatInstanceRestoredStateExpectation {
				readonly inner1: number;
				readonly inner2: number;
				readonly inner3: number;
			}

			interface MissingRepeatInstanceInputCase {
				readonly detail: string;
				readonly serializedInput: XFormsElement;
				readonly expectedState: MissingRepeatInstanceRestoredStateExpectation[];
			}

			const missingRepeatInstanceInputs: readonly MissingRepeatInstanceInputCase[] = [
				{
					detail: 'repeat instances not serialized at all',
					// prettier-ignore
					serializedInput:
						t('data id="repeat-serde-count"',
							t('rep-count', '2')),
					expectedState: [
						{ inner1: 1, inner2: 2, inner3: 4 },
						{ inner1: 2, inner2: 4, inner3: 8 },
					],
				},

				{
					detail: 'single repeat instance missing',
					// prettier-ignore
					serializedInput:
						t('data id="repeat-serde-count"',
							t('rep-count', '3'),
							t('repeat',
								t('inner1', '1'),
								t('inner2', '2'),
								t('inner3', '4')),
							t('repeat',
								t('inner1', '2'),
								t('inner2', '4'),
								t('inner3', '8'))),
					expectedState: [
						{ inner1: 1, inner2: 2, inner3: 4 },
						{ inner1: 2, inner2: 4, inner3: 8 },
						{ inner1: 3, inner2: 6, inner3: 12 },
					],
				},

				{
					detail: 'child/leaf nodes missing',
					// prettier-ignore
					serializedInput:
						t('data id="repeat-serde-count"',
							t('rep-count', '4'),
							t('repeat',
								t('inner1', '1')),
							t('repeat',
								t('inner2', '4')),
							t('repeat',
								t('inner3', '12')),
							t('repeat')),
					expectedState: [
						{ inner1: 1, inner2: 2, inner3: 4 },
						{ inner1: 2, inner2: 4, inner3: 8 },
						{ inner1: 3, inner2: 6, inner3: 12 },
						{ inner1: 4, inner2: 8, inner3: 16 },
					],
				},
			];

			describe.each<MissingRepeatInstanceInputCase>(missingRepeatInstanceInputs)(
				'missing repeat instance input ($detail)',
				({ serializedInput, expectedState }) => {
					it('restores complete repeat instance state from the form-defined template', async () => {
						const instanceInput = fabricateInstanceInput(serializedInput);
						const restored = await scenario.restoreWebFormsInstanceState(instanceInput);

						const expectedCount = expectedState.length;

						expect(restored.answerOf('/data/rep-count')).toEqualAnswer(intAnswer(expectedCount));
						expect(restored.countRepeatInstancesOf('/data/repeat')).toBe(expectedCount);

						for (const entry of expectedState.entries()) {
							const [index, { inner1, inner2, inner3 }] = entry;
							const expectedRepeatPosition = index + 1;
							const nodesetPrefix = `/data/repeat[${expectedRepeatPosition}]`;

							expect(restored.answerOf(`${nodesetPrefix}/inner1`)).toEqualAnswer(intAnswer(inner1));
							expect(restored.answerOf(`${nodesetPrefix}/inner2`)).toEqualAnswer(intAnswer(inner2));
							expect(restored.answerOf(`${nodesetPrefix}/inner3`)).toEqualAnswer(intAnswer(inner3));
						}
					});
				}
			);

			describe('excess count-controlled repeat instances', () => {
				it('ignores repeat instances in excess of specified count', async () => {
					const warningTracker = new WarningTracker();

					// prettier-ignore
					const serializedInput = t('data id="repeat-serde-count"',
						t('rep-count', '2'),
						t('repeat',
							t('inner1', '1'),
							t('inner2', '2'),
							t('inner3', '4')),
						t('repeat',
							t('inner1', '2'),
							t('inner2', '4'),
							t('inner3', '8')),
						t('repeat',
							t('inner1', '86'),
							t('inner2', '75'),
							t('inner3', '309')));

					const instanceInput = fabricateInstanceInput(serializedInput);

					const restored = await scenario.restoreWebFormsInstanceState(instanceInput);

					warningTracker.assertExcessRepeatInstanceWarningProduced();

					expect(restored.answerOf('/data/rep-count')).toEqualAnswer(intAnswer(2));
					expect(restored.countRepeatInstancesOf('/data/repeat')).toBe(2);

					expect(restored.answerOf('/data/repeat[1]/inner1')).toEqualAnswer(intAnswer(1));
					expect(restored.answerOf('/data/repeat[1]/inner2')).toEqualAnswer(intAnswer(2));
					expect(restored.answerOf('/data/repeat[1]/inner3')).toEqualAnswer(intAnswer(4));
					expect(restored.answerOf('/data/repeat[2]/inner1')).toEqualAnswer(intAnswer(2));
					expect(restored.answerOf('/data/repeat[2]/inner2')).toEqualAnswer(intAnswer(4));
					expect(restored.answerOf('/data/repeat[2]/inner3')).toEqualAnswer(intAnswer(8));
				});
			});
		});

		describe('jr:noAddRemove', () => {
			let scenario: Scenario;

			beforeEach(async () => {
				scenario = await Scenario.init(
					'Repeat serde (noAddRemove)',
					// prettier-ignore
					html(
						head(
							title('Repeat serde (noAddRemove)'),
							model(
								mainInstance(t('data id="repeat-serde-no-add-remove"',
									t('repeat',
										t('inner1', '2'),
										t('inner2'),
										t('inner3')
									),
									t('repeat',
										t('inner1', '7'),
										t('inner2'),
										t('inner3')
									))),
								bind('/data/repeat/inner2').calculate('2 * ../inner1'),
								bind('/data/repeat/inner3').calculate('2 * ../inner2'))),

						body(
							input('/data/rep-count', label('Repeat count')),
							t('repeat nodeset="/data/repeat" jr:noAddRemove="true()"',
								input('/data/repeat/inner1', label('inner1')))))
				);
			});

			it('restores fixed repeat instances in their state prior to serialization', async () => {
				// Sanity check preconditions
				expect(scenario.answerOf('/data/repeat[1]/inner1')).toEqualAnswer(intAnswer(2));
				expect(scenario.answerOf('/data/repeat[1]/inner2')).toEqualAnswer(intAnswer(4));
				expect(scenario.answerOf('/data/repeat[1]/inner3')).toEqualAnswer(intAnswer(8));
				expect(scenario.answerOf('/data/repeat[2]/inner1')).toEqualAnswer(intAnswer(7));
				expect(scenario.answerOf('/data/repeat[2]/inner2')).toEqualAnswer(intAnswer(14));
				expect(scenario.answerOf('/data/repeat[2]/inner3')).toEqualAnswer(intAnswer(28));

				const result = await scenarioFromCurrentInstanceState(scenario);

				expect(result.countRepeatInstancesOf('/data/repeat')).toBe(2);
				expect(result.answerOf('/data/repeat[1]/inner1')).toEqualAnswer(intAnswer(2));
				expect(result.answerOf('/data/repeat[1]/inner2')).toEqualAnswer(intAnswer(4));
				expect(result.answerOf('/data/repeat[1]/inner3')).toEqualAnswer(intAnswer(8));
				expect(result.answerOf('/data/repeat[2]/inner1')).toEqualAnswer(intAnswer(7));
				expect(result.answerOf('/data/repeat[2]/inner2')).toEqualAnswer(intAnswer(14));
				expect(result.answerOf('/data/repeat[2]/inner3')).toEqualAnswer(intAnswer(28));
			});

			interface MissingRepeatInstanceRestoredStateExpectation {
				readonly inner1: ComparableAnswer;
				readonly inner2: ComparableAnswer;
				readonly inner3: ComparableAnswer;
			}

			const NAN_ANSWER = stringAnswer(String(NaN));

			interface MissingRepeatInstanceInputCase {
				readonly detail: string;
				readonly serializedInput: XFormsElement;
				readonly expectedState: MissingRepeatInstanceRestoredStateExpectation[];
			}

			const missingRepeatInstanceInputs: readonly MissingRepeatInstanceInputCase[] = [
				{
					detail: 'repeat instances not serialized at all',
					// prettier-ignore
					serializedInput:
						t('data id="repeat-serde-no-add-remove"'),
					expectedState: [
						{ inner1: stringAnswer(''), inner2: NAN_ANSWER, inner3: NAN_ANSWER },
						{ inner1: stringAnswer(''), inner2: NAN_ANSWER, inner3: NAN_ANSWER },
					],
				},

				{
					detail: 'single repeat instance missing',
					// prettier-ignore
					serializedInput:
						t('data id="repeat-serde-no-add-remove"',
							t('repeat',
								t('inner1', '3'),
								t('inner2', '6'),
								t('inner3', '12'))),
					expectedState: [
						{ inner1: intAnswer(3), inner2: intAnswer(6), inner3: intAnswer(12) },
						{ inner1: stringAnswer(''), inner2: NAN_ANSWER, inner3: NAN_ANSWER },
					],
				},

				{
					detail: 'child/leaf nodes missing',
					// prettier-ignore
					serializedInput:
						t('data id="repeat-serde-no-add-remove"',
							t('repeat',
								t('inner1', '4')),
							t('repeat',
								t('inner2', '8'))),
					expectedState: [
						{ inner1: intAnswer(4), inner2: intAnswer(8), inner3: intAnswer(16) },
						{ inner1: stringAnswer(''), inner2: NAN_ANSWER, inner3: NAN_ANSWER },
					],
				},
			];

			describe.each<MissingRepeatInstanceInputCase>(missingRepeatInstanceInputs)(
				'missing repeat instance input ($detail)',
				({ serializedInput, expectedState }) => {
					it('restores complete repeat instance state from the form-defined template', async () => {
						const instanceInput = fabricateInstanceInput(serializedInput);
						const restored = await scenario.restoreWebFormsInstanceState(instanceInput);

						const expectedCount = expectedState.length;

						expect(restored.countRepeatInstancesOf('/data/repeat')).toBe(expectedCount);

						for (const entry of expectedState.entries()) {
							const [index, { inner1, inner2, inner3 }] = entry;
							const expectedRepeatPosition = index + 1;
							const nodesetPrefix = `/data/repeat[${expectedRepeatPosition}]`;

							expect(restored.answerOf(`${nodesetPrefix}/inner1`)).toEqualAnswer(inner1);
							expect(restored.answerOf(`${nodesetPrefix}/inner2`)).toEqualAnswer(inner2);
							expect(restored.answerOf(`${nodesetPrefix}/inner3`)).toEqualAnswer(inner3);
						}
					});
				}
			);

			describe('excess fixed repeat instances', () => {
				it('ignores repeat instances in excess of specified count', async () => {
					const warningTracker = new WarningTracker();

					// prettier-ignore
					const serializedInput = t('data id="repeat-serde-no-add-remove"',
						t('repeat',
							t('inner1', '1'),
							t('inner2', '2'),
							t('inner3', '4')),
						t('repeat',
							t('inner1', '2'),
							t('inner2', '4'),
							t('inner3', '8')),
						t('repeat',
							t('inner1', '86'),
							t('inner2', '75'),
							t('inner3', '309')));

					const instanceInput = fabricateInstanceInput(serializedInput);

					const restored = await scenario.restoreWebFormsInstanceState(instanceInput);

					warningTracker.assertExcessRepeatInstanceWarningProduced();

					expect(restored.countRepeatInstancesOf('/data/repeat')).toBe(2);

					expect(restored.answerOf('/data/repeat[1]/inner1')).toEqualAnswer(intAnswer(1));
					expect(restored.answerOf('/data/repeat[1]/inner2')).toEqualAnswer(intAnswer(2));
					expect(restored.answerOf('/data/repeat[1]/inner3')).toEqualAnswer(intAnswer(4));
					expect(restored.answerOf('/data/repeat[2]/inner1')).toEqualAnswer(intAnswer(2));
					expect(restored.answerOf('/data/repeat[2]/inner2')).toEqualAnswer(intAnswer(4));
					expect(restored.answerOf('/data/repeat[2]/inner3')).toEqualAnswer(intAnswer(8));
				});
			});
		});

		describe('direct relevance on repeat instances', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * Writing this test to determine the current behavior or compare with
			 * JavaRosa's behavior has been deferred, per request by @lognaturel.
			 */
			it.todo('restores relevant repeat instances in their relevant position');
		});
	});
});

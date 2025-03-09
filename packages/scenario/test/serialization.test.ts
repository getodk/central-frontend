import { OPENROSA_XFORMS_NAMESPACE_URI } from '@getodk/common/constants/xmlns.ts';
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
	LoadFormOptions,
	RestoreFormInstanceInput,
} from '@getodk/xforms-engine';
import { constants } from '@getodk/xforms-engine';
import { beforeEach, describe, expect, it } from 'vitest';
import { intAnswer } from '../src/answer/ExpectedIntAnswer.ts';
import { stringAnswer } from '../src/answer/ExpectedStringAnswer.ts';
import { Scenario } from '../src/jr/Scenario.ts';
import { setUpSimpleReferenceManager } from '../src/jr/reference/ReferenceManagerTestUtils.ts';
import { r } from '../src/jr/resource/ResourcePathHelper.ts';
import { nullValue } from '../src/value/ExpectedNullValue.ts';

// Ported as of https://github.com/getodk/javarosa/commit/5ae68946c47419b83e7d28290132d846e457eea6
describe('Serialization', () => {
	/**
	 * **PORTING NOTES**
	 *
	 * Discussing these tests in Slack, it was determined that they're not
	 * currently applicable to the web forms project. The first test is ported
	 * largely because it was already most of the way there by this point,
	 * although much of the supporting logic for a more faithful port has been
	 * omitted for now (with some breadcrumbs on thinking behind that supporting
	 * logic left in for posterity in case it becomes applicable in the future).
	 *
	 * We reached the conclusion to defer porting the rest of these tests for now,
	 * on the basis that the current serialization functionality under test is in
	 * support of specific performance optimizations; that the tests exercise
	 * implementation details not directly pertinent to web forms at this time;
	 * that the performance optimizations in question are themselves not likely to
	 * be pertinent to web forms, at least at this time.
	 *
	 * We also agreed that this note would serve as an explanation of the above,
	 * as well as an opportunity to briefly mention that we may have other reasons
	 * to support (de)serialization, and to test that support, likely around
	 * offline functionality. As such, we may want to revisit these skipped
	 * JavaRosa tests if they seem valuable for that effort when we get to it.
	 */
	describe('FormDefSerializationTest.java', () => {
		const getSimplestFormScenario = async (): Promise<Scenario> => {
			return Scenario.init(
				'Simplest',
				html(
					head(
						title('Simplest'),
						model(mainInstance(t('data id="simplest"', t('a'))), bind('/data/a').type('string'))
					),
					body(input('/data/a'))
				)
			);
		};

		describe('instance name', () => {
			describe('for reference in main instance', () => {
				it.skip('is always null', async () => {
					const scenario = await getSimplestFormScenario();

					scenario.next('/data/a');

					expect(scenario.refAtIndex().getInstanceName()).toEqual(nullValue());

					const deserialized = await scenario.serializeAndDeserializeForm();

					deserialized.next('/data/a');

					expect(deserialized.refAtIndex().getInstanceName()).toEqual(nullValue());
				});

				it.skip('instanceName_forFormDefEvaluationContext_isAlwaysNull');
				it.skip('instanceName_forFormDefMainInstance_isAlwaysNull');
			});
		});
	});
});

describe('SameRefDifferentInstancesIssue449Test.java (regression tests)', () => {
	describe('form with same ref in different instances', () => {
		/**
		 * **PORTING NOTES**
		 *
		 * - Test has been revised to reference
		 *   {@link Scenario.proposed_serializeAndRestoreInstanceState}, as the test
		 *   does exercise instance state serialization/deserialization.
		 *
		 * - Test has been revised to remove superfluous XPath position predicates
		 *   (i.e. `[0]`) in references to non-repeat instance nodes.
		 *
		 * - Rephrase? "Successfully" in a test description is implied, like
		 *   "correct". Prefer to describe actual behavior under test, which is
		 *   vague here.
		 */
		it('is [~~]successfully[~~] deserialized', async () => {
			const formFile = r('issue_449.xml');
			setUpSimpleReferenceManager(formFile.getParent(), 'file');

			const scenario = await Scenario.init(formFile);

			scenario.answer('/data/new-part', 'c');

			expect(scenario.answerOf('/data/aggregated')).toEqualAnswer(stringAnswer('a b c'));

			const deserialized = await scenario.proposed_serializeAndRestoreInstanceState();

			expect(deserialized.answerOf('/data/new-part')).toEqualAnswer(stringAnswer('c'));
			expect(deserialized.answerOf('/data/aggregated')).toEqualAnswer(stringAnswer('a b c'));

			deserialized.answer('/data/new-part', 'c2');

			expect(deserialized.answerOf('/data/aggregated')).toEqualAnswer(stringAnswer('a b c2'));
		});

		/**
		 * **PORTING NOTES**
		 *
		 * JavaRosa's equivalent of this test does actually exercize instance state
		 * serde, and specifically exercises constraint validation behavior before
		 * and after the same set of value changes. It may or may not be worth
		 * porting the test, but that's still deferred to avoid getting sidetracked
		 * by JavaRosa's different semantics for **setting** constraint-violating
		 * values:
		 *
		 * - JR: blocks value assignment
		 * - WF: accepts assignment, reports constraint violation in validation
		 *   state as consequence
		 *
		 * There is also a test exercising very similar semantics in
		 * {@link ./validity-state.test.ts}, also updated (now passing!) in this
		 * commit. It is similar enough that we might consider porting this one
		 * effectively redundant.
		 */
		it.todo('[applies constraints] constraints are correctly applied after deserialization');
	});
});

describe('ExternalSecondaryInstanceParseTest.java', () => {
	describe('form with external secondary XML instance', () => {
		/**
		 * **PORTING NOTES**
		 *
		 * If porting this test becomes a priority, note that all of the
		 * functionality under test currently exercies implementation details of
		 * {@link FormParserHelper}. There's currently no analogue to that in the
		 * engine/client interface, and it isn't anticipated that we'd introduce one
		 * in the foreseeable future.
		 */
		it.skip('should serialize and deserialize');
	});

	describe('deserialized form [~~]def[~~] created from a form with external secondary XML instance', () => {
		it.skip('should contain that external instance');
	});

	describe('//region Missing external file', () => {
		it.skip(
			'realInstanceIsResolved_whenFormIsDeserialized_afterPlaceholderInstanceUsed_andFileNowExists'
		);

		/**
		 * **PORTING NOTES**
		 *
		 * It sounds (from the JavaRosa comment, preserved below) like the
		 * conceptual model here is:
		 *
		 * 0. Given a form with external instance reference, and given an initial
		 *    inability to retrieve the resource for it
		 * 1. JavaRosa will produce a "placeholder" (empty instance representation)
		 *    for the unavailable resource
		 * 2. A client (Collect) may at some point serialize the form state
		 * 3. The client may then attempt to deserialize that serialization, calling
		 *    into JavaRosa to do so
		 * 4. Because(?) JavaRosa used a "placeholder" prior to that serialization,
		 *    upon deserialization it will once again attempt to retrieve the
		 *    external instance resource
		 * 5. While parsing will produce a "placeholder" for an unretrievable
		 *    external instance resource, deserialization will produce an error
		 *    instead.
		 * 6. It is expected that a client will resolve this error condition by
		 *    bypassing deserialization (and potentially discarding the serialized
		 *    state?), by re-parsing the form... thereby allowing JavaRosa to once
		 *    again produce a "placeholder".
		 *
		 * It's unclear if any of this is pertinent to web forms, but it's hard not
		 * to ask... if this mental model is roughly correct:
		 *
		 * - Is this ceremony something essential to the distinction between "parse"
		 *   and "deserialize"? Is there additional mental model to help make the
		 *   distinction more clear?
		 *
		 * - Insofar as we may find ourselves implementing similar logic (albeit
		 *   serving other purposes), how can we establish a clear interface
		 *   contract around behaviors like this? Should it be more consistent? Does
		 *   our current {@link LoadFormOptions.fetchFormDefinition} provide enough
		 *   informational surface area to communicate such intent (and allow both
		 *   clients and engine alike to have clarity of that intent at
		 *   call/handling sites)?
		 *
		 * - - -
		 *
		 * JR:
		 *
		 * Clients would typically catch this exception and try parsing the form
		 * again which would succeed by using the placeholder.
		 */
		it.skip(
			'fileNotFoundException_whenFormIsDeserialized_afterPlaceholderInstanceUsed_andFileStillMissing'
		);

		/**
		 * **PORTING NOTES**
		 *
		 * The original notes below were answered with
		 * {@link https://github.com/getodk/web-forms/pull/110#discussion_r1614139373 | this excellent explanation}:
		 *
		 * > This is the result of a bunch of implementation details/decisions in JR
		 * > and Collect. As you've noted in some earlier tests, lists of select
		 * > options are not part of the DAG/recomputation model. Choice lists are
		 * > only computed when they need to be displayed. In some cases, this can
		 * > result in a significant perf improvement.
		 * >
		 * > So the choicesOf call computes the choices. And that's fine even if the
		 * > references for label and name don't exist because that just returns the
		 * > entirety of every choice item. It's only when a selection is made that
		 * > there's an attempt to use the specified references and that causes a
		 * > crash.
		 *
		 * - - -
		 *
		 * Expanding on the mental model we're trying to form in the skipped test
		 * directly above...
		 *
		 * - If this produces an error condition, why is it deferred to _accessing a
		 *   select's available itemset choices_?
		 *
		 * - The JavaRosa comment, preserved below, suggests that the error should
		 *   occur "when making a choice". That makes it sound like the intent is:
		 *
		 *     0. Parsing fails to resolve an external instance resource, producing
		 *        a "placeholder" representation.
		 *
		 *     1. Deserialization resolves that resource.
		 *
		 *     2. This is considered an inconsistent state, which cannot be
		 *        reconciled on the deserialized state.
		 *
		 *     3. An allowance is made for operating on form state with this
		 *        inconsistency **so long as the inconsistency isn't consulted in a
		 *        subsequent state change**.
		 *
		 *     If that's the case... why isn't the error produced on a write call,
		 *     rather than when attempting to read the options? Wouldn't this
		 *     produce an error by simply proceeding through the deserialized form
		 *     state without making any state change at all?
		 *
		 * - - -
		 *
		 * JR:
		 *
		 * It would be possible for a formdef to be serialized without access to the
		 * external secondary instance and then deserialized with access. In that
		 * case, there's nothing to validate that the value and label references for
		 * a dynamic select correspond to real nodes in the secondary instance so
		 * there's a runtime exception when making a choice.
		 */
		it.skip(
			'exceptionFromChoiceSelection_whenFormIsDeserialized_afterPlaceholderInstanceUsed_andFileMissingColumns'
		);
	});
});

/**
 * @todo Maybe we should consider either:
 *
 * - A corresponding "deserialization" suite/module
 * - Renaming this suite/module "serde" (or come up with some more obvious term
 *   for this concept as it applies to the scope of serializing and
 *   deserializing instance state)?
 */
describe('Restoring serialized instance state', () => {
	/**
	 * Note: this is _implicitly covered_ by tests exercising less basic concepts,
	 * e.g. restoration of non-relevant nodes. Is there any value (maybe social?)
	 * in explicitly testing basics here?
	 */
	describe.skip('basic restoration of instance state');

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

			const restored = await scenario.proposed_serializeAndRestoreInstanceState();

			// Assertion of non-relevance and blank value will fail if the node,
			// omitted as non-relevant from serialization, is not restored.
			expect(restored.getInstanceNode('/data/grp/inp')).toBeNonRelevant();
			expect(restored.answerOf('/data/grp/inp')).toEqualAnswer(stringAnswer(''));
		});

		it('restores a non-relevant leaf node with its model default value when it becomes relevant', async () => {
			// Sanity check precondition: relevant default value
			expect(scenario.answerOf('/data/grp/inp')).toEqualAnswer(stringAnswer('inp default value'));

			scenario.answer('/data/inp-rel', 0);

			// Sanity check precondition: non-relevant leaf node is blank
			expect(scenario.answerOf('/data/grp/inp')).toEqualAnswer(stringAnswer(''));

			const restored = await scenario.proposed_serializeAndRestoreInstanceState();

			// Sanity check precondition: node restored, continues to be
			// non-relevant (and blank)
			expect(restored.getInstanceNode('/data/grp/inp')).toBeNonRelevant();
			expect(restored.answerOf('/data/grp/inp')).toEqualAnswer(stringAnswer(''));

			restored.answer('/data/inp-rel', 1);

			expect(restored.getInstanceNode('/data/grp/inp')).toBeRelevant();
			expect(restored.answerOf('/data/grp/inp')).toEqualAnswer(stringAnswer('inp default value'));
		});

		it('restores an omitted subtree node as non-relevant', async () => {
			scenario.answer('/data/grp-rel', 0);

			// Sanity check precondition: non-relevant leaf node is blank
			expect(scenario.answerOf('/data/grp/inp')).toEqualAnswer(stringAnswer(''));

			const restored = await scenario.proposed_serializeAndRestoreInstanceState();

			expect(restored.getInstanceNode('/data/grp')).toBeNonRelevant();
		});

		it("restores a non-relevant subtree node's descendant leaf node with its model default value when the restored subtree becomes relevant", async () => {
			// Sanity check precondition: relevant default value
			expect(scenario.answerOf('/data/grp/inp')).toEqualAnswer(stringAnswer('inp default value'));

			scenario.answer('/data/grp-rel', 0);

			// Sanity check precondition: subtree non-relevant, descendant blank by
			// inheriting non-relevance
			expect(scenario.getInstanceNode('/data/grp')).toBeNonRelevant();
			expect(scenario.answerOf('/data/grp/inp')).toEqualAnswer(stringAnswer(''));

			const restored = await scenario.proposed_serializeAndRestoreInstanceState();

			// Sanity check precondition: node restored, continues to be non-relevant,
			// descendant leaf node is still blank
			expect(restored.getInstanceNode('/data/grp')).toBeNonRelevant();
			expect(restored.answerOf('/data/grp/inp')).toEqualAnswer(stringAnswer(''));

			restored.answer('/data/grp-rel', 1);

			// Once restored subtree node is relevant, descendant leaf node is
			// restored with the model-defined default for that node
			expect(restored.getInstanceNode('/data/grp')).toBeRelevant();
			expect(restored.answerOf('/data/grp/inp')).toEqualAnswer(stringAnswer('inp default value'));
		});
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
			const restored1 = await scenario.proposed_serializeAndRestoreInstanceState();

			expect(restored1.answerOf('/data/a')).toEqualAnswer(intAnswer(2));
			expect(restored1.answerOf('/data/b')).toEqualAnswer(intAnswer(6));
			expect(restored1.answerOf('/data/c')).toEqualAnswer(intAnswer(40));

			restored1.answer('/data/a', 3);

			expect(restored1.answerOf('/data/a')).toEqualAnswer(intAnswer(3));
			expect(restored1.answerOf('/data/b')).toEqualAnswer(intAnswer(9));
			expect(restored1.answerOf('/data/c')).toEqualAnswer(intAnswer(60));

			const restored2 = await restored1.proposed_serializeAndRestoreInstanceState();

			expect(restored2.answerOf('/data/a')).toEqualAnswer(intAnswer(3));
			expect(restored2.answerOf('/data/b')).toEqualAnswer(intAnswer(9));
			expect(restored2.answerOf('/data/c')).toEqualAnswer(intAnswer(60));
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

			const restored = await scenario.proposed_serializeAndRestoreInstanceState();

			expect(restored.answerOf('/data/a')).toEqualAnswer(intAnswer(2));
			expect(restored.answerOf('/data/b')).toEqualAnswer(intAnswer(6));
			expect(restored.answerOf('/data/c')).toEqualAnswer(intAnswer(40));
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
			const restored = await scenario.proposed_serializeAndRestoreInstanceState();

			// Assert that same number of serialized repeat instances is restored
			expect(restored.countRepeatInstancesOf('/data/repeat')).toBe(2);

			// Assert that written values are restored in each repeat instance
			expect(restored.answerOf('/data/repeat[1]/inner1')).toEqualAnswer(intAnswer(3));
			expect(restored.answerOf('/data/repeat[2]/inner1')).toEqualAnswer(intAnswer(4));

			// Assert that calculated values are restored as well
			expect(restored.answerOf('/data/repeat[1]/inner2')).toEqualAnswer(intAnswer(6));
			expect(restored.answerOf('/data/repeat[1]/inner3')).toEqualAnswer(intAnswer(12));
			expect(restored.answerOf('/data/repeat[2]/inner2')).toEqualAnswer(intAnswer(8));
			expect(restored.answerOf('/data/repeat[2]/inner3')).toEqualAnswer(intAnswer(16));
		});

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

				const restored = await scenario.proposed_serializeAndRestoreInstanceState();

				expect(restored.answerOf('/data/rep-count')).toEqualAnswer(intAnswer(2));
				expect(restored.countRepeatInstancesOf('/data/repeat')).toBe(2);
				expect(restored.answerOf('/data/repeat[1]/inner1')).toEqualAnswer(intAnswer(1));
				expect(restored.answerOf('/data/repeat[1]/inner2')).toEqualAnswer(intAnswer(2));
				expect(restored.answerOf('/data/repeat[1]/inner3')).toEqualAnswer(intAnswer(4));
				expect(restored.answerOf('/data/repeat[2]/inner1')).toEqualAnswer(intAnswer(2));
				expect(restored.answerOf('/data/repeat[2]/inner2')).toEqualAnswer(intAnswer(4));
				expect(restored.answerOf('/data/repeat[2]/inner3')).toEqualAnswer(intAnswer(8));
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

				const restored = await scenario.proposed_serializeAndRestoreInstanceState();

				expect(restored.countRepeatInstancesOf('/data/repeat')).toBe(2);
				expect(restored.answerOf('/data/repeat[1]/inner1')).toEqualAnswer(intAnswer(2));
				expect(restored.answerOf('/data/repeat[1]/inner2')).toEqualAnswer(intAnswer(4));
				expect(restored.answerOf('/data/repeat[1]/inner3')).toEqualAnswer(intAnswer(8));
				expect(restored.answerOf('/data/repeat[2]/inner1')).toEqualAnswer(intAnswer(7));
				expect(restored.answerOf('/data/repeat[2]/inner2')).toEqualAnswer(intAnswer(14));
				expect(restored.answerOf('/data/repeat[2]/inner3')).toEqualAnswer(intAnswer(28));
			});
		});
	});
});

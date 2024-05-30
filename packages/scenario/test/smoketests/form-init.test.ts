import { describe, expect, it } from 'vitest';
import { Scenario } from '../../src/jr/Scenario.ts';
import { r } from '../../src/jr/resource/ResourcePathHelper.ts';

/**
 * **PORTING NOTES**
 *
 * This is intended, conceptually, as an analogue to JavaRosa's
 * `assertNoParseErrors` method, defined on the `XFormParserTest` test class.
 *
 * This is a stub function/proposal which accepts a {@link Scenario}. The intent
 * is to:
 *
 * 1. Anticipate our future goal of producing Result types for fallible aspects
 *    of the engine/client interface, and potentially adapt the
 *    {@link Scenario.init} interface to allow for more flexible assertions of
 *    expected error conditions.
 *
 * 2. Anticipate, also, the possibility that we may want to **non-modal**
 *    produce error (or warning) conditions (i.e. not blocking form
 *    initialization and/or downstream form filling activity). This would
 *    (should) involve some careful consideration, but an obvious use case might
 *    be application of form feature detection where we expect a form to be
 *    usable as-is, but may want to alert users to aspects of the form that are
 *    ignored and/or deprecated, or otherwise warrant a form designer/tester's
 *    attention.
 *
 * We should consider applying an assertion like this more broadly, perhaps even
 * globally. In which case, it might make more sense to invoke it implicitly,
 * potentially exempting certain kinds of expected failures, as part of call to
 * {@link Scenario.init}.
 */
const expectNoInitializationErrors = (_scenario: Scenario) => {
	if (!didLogAssertNoInitializationErrorsTODOMessage) {
		// eslint-disable-next-line no-console
		console.log('TODO: assertNoParseErrors');

		didLogAssertNoInitializationErrorsTODOMessage = true;
	}
};

let didLogAssertNoInitializationErrorsTODOMessage = false;

interface FailureExpectationOptions {
	readonly disregardJavaRosaFailureExpectation: boolean;
}

/**
 * **PORTING NOTES**
 *
 * This is initially going to be a dumping ground for tests in JavaRosa's
 * `XFormParserTest.java` which don't reference {@link Scenario} or use the
 * aspects of its APIs which we've ported for sharing test logic. The tests
 * added here will simply initialize (or attempt to) the forms referenced by
 * those tests in JavaRosa, with direct reference to the originating test.
 *
 * If there is additional logic that looks like it would be of interest to
 * include in the web forms integration test suite, that logic _may_ be copied
 * (commented out) as a frame of reference. Otherwise tests will be added **only
 * initializing the pertinent form**. In general, if the JavaRosa test only
 * checks the form's initialization and the string value of its title, it will
 * be treated as the latter.
 *
 * For each test, regardless of the fidelity of its porting, this is the
 * expected porting process:
 *
 * - If initialization succeeds, it will generally be run with the standard
 *   Vitest {@link it} function. These tests will likely have minimal, if any,
 *   porting notes. When the corresponding JavaRosa test calls
 *   `assertNoParseErrors`, that call be replaced with a call to
 *   {@link expectNoInitializationErrors}. Passing initialization tests which
 *   had no corresponding call in JavaRosa add this call anyway. See
 *   {@link expectNoInitializationErrors} JSDoc for details of the function's
 *   rationale and its anticipated future usage.
 *
 * - If initialization is expected to fail in JavaRosa, we will use one of the
 *   typical mechanisms to test for expected failure modes, and an expected
 *   error condition will be asserted. That assertion will very likely be less
 *   specific than their equivalent assertions in JavaRosa (which tend to
 *   reference specific exception classes, for which we may not produce
 *   equivalents). Additionally:
 *
 *     - In some cases, an expected error seems highly unlikely to represent a
 *       valid/meaningful requirement (e.g. acknowledging a limitiation in
 *       current JavaRosa behavior, with known deviation from pertinent aspects
 *       of the spec). In those cases, the test will be parameterized with
 *       {@link FailureExpectationOptions} to demonstrate both JavaRosa's
 *       expectation and the behavior most consistent with spec expectations.
 *
 *     - Otherwise, if an expected error condition does not occur, the test will
 *       be run with {@link it.fails} so we'll know to update it for future
 *       changes in behavior.
 *
 * - If initialization is expected to succeed in JavaRosa, but fails in web
 *   forms, the test will be run with {@link it.fails}. As appropriate and
 *   reasonable, these tests will be accompanied by porting notes discussing
 *   known and/or hypothesized deatils of their failure mode. As with passing
 *   tests, a call to {@link expectNoInitializationErrors} will either be added,
 *   or stand in for calls to JavaRosa's conceptually similar
 *   `assertNoParseErrors` method.
 *
 * - Some tests may be marked {@link it.todo} if there are test environment
 *   preconditions we can't yet satisfy. These will be kept as minimal as
 *   reasonable possible, so we can automatically learn about as many behavior
 *   changes as possible.
 *
 * - Some tests may be determined impertinent for the web forms integration
 *   testing suite overall. These will be marked {@link it.skip}, and we can
 *   consider removing them in review or at any point in the future.
 *
 * - Tests from `XFormParserTest.java` which exercise {@link Scenario} APIs
 *   which will be ported to more appropriate suites. For clarity (or at least
 *   to simplify the porting effort), they will _also_ be marked {@link it.skip}
 *   here with a note to that effect.
 *
 * - - -
 *
 * For the sake of initial velocity, the test descriptions will be copied
 * verbatim, but they may be updated later to match the conventional BDD-ish
 * format if we deem that appropriate.
 *
 * - - -
 *
 * Note that some of these tests reference form fixtures with features we don't
 * currently organize into a specific suite. I'll try to catalogue these here as
 * they're encountered:
 *
 * - `<range>`
 * - `<rank>`
 *
 * - - -
 *
 * If this process holds, it very closely resembles the schema for a
 * parameterized/table test. A first pass at generalization felt like it was
 * more trouble/less clear than its worth. But with some hindsight, it may be
 * worth revisiting that conclusion. In particular because…
 *
 * - In the future, we may find there are other interesting forms we'd like to
 *   add to this suite. Making that as easy as possible is a good goal.
 *   Generalizing it as a parameterized/table test schema could help to
 *   accommodate that.
 *
 * - With such a schema, we could consider using the same data driving this test
 *   suite for other testing purposes (potentially even in other packages), to
 *   automatically populate a dev/debug-focused UI experience, etc.
 *
 * - In theory, we could evolve such a system to effectively smoke test every
 *   form fixture in our repertoire... or even to supplement it with other
 *   fixture sources (e.g. non-public forms hosted locally or in a
 *   team-/user-shared setting).
 */
describe('Form initialization smoke tests', () => {
	describe('XFormParserTest.java', () => {
		interface NamespaceOptions {
			readonly includeCommonNamespaces: boolean;
		}

		it('parsesSimpleForm', async () => {
			const scenario = await Scenario.init(r('simple-form.xml'));

			expectNoInitializationErrors(scenario);
		});

		it('parsesForm2', async () => {
			const scenario = await Scenario.init(r('form2.xml'));

			// assertEquals("My Survey", formDef.getTitle());
			// assertEquals(3, formDef.getChildren().size());
			// assertEquals("What is your first name?", formDef.getChild(0).getLabelInnerText());

			expectNoInitializationErrors(scenario);
		});

		/**
		 * Scenario test. Ported elsewhere.
		 */
		it.skip('spacesBetweenOutputs_areRespected');

		/**
		 * **PORTING NOTES**
		 *
		 * It's unclear why `SECONDARY_INSTANCE_XML` is defined in the
		 * `@Before`/`setUp` method in the JavaRosa "vat". Since it's only
		 * referenced by this test, we define it locally for now.
		 */
		it('parsesSecondaryInstanceForm', async () => {
			const SECONDARY_INSTANCE_XML = r('secondary-instance.xml');

			const scenario = await Scenario.init(SECONDARY_INSTANCE_XML);

			expectNoInitializationErrors(scenario);
		});

		it('parsesSecondaryInstanceForm2', async () => {
			const scenario = await Scenario.init(r('internal_select_10.xml'));

			expectNoInitializationErrors(scenario);
		});

		/**
		 * **PORTING NOTES**
		 *
		 * - Fails on primary instance element's lack of id attribute.
		 *
		 * - Unclear if there will be a need for additional setup in the future when
		 *   we add last-saved support.
		 */
		it.fails('parsesLastSavedInstanceWithNullSrc', async () => {
			const scenario = await Scenario.init(r('last-saved-blank.xml'));

			expectNoInitializationErrors(scenario);

			// assertEquals("Form with last-saved instance (blank)", formDef.getTitle());

			// DataInstance lastSaved = formDef.getNonMainInstance("last-saved");
			// AbstractTreeElement root = lastSaved.getRoot();
			// assertEquals(0, root.getNumChildren());
		});

		/**
		 * **PORTING NOTES**
		 *
		 * - There is definitely a need for additional setup to test this
		 *   meaningfully. Revisit when we add last-saved support.
		 *
		 * - Observation: in theory, it could be nice to have a more specific
		 *   mechanism for deferring/marking known failure of tests **around pending
		 *   support for specific features**, so they can run to completion or
		 *   failure once we believe the feature is testable. May not be worth the
		 *   effort with a quick enough feature development/bugfix velocity.
		 */
		it.todo('parsesLastSavedInstanceWithFilledForm', () => {
			// Path formName = r("last-saved-blank.xml");
			// Path lastSavedSubmissionDirectory = r("last-saved-filled.xml").toAbsolutePath().getParent();
			// ReferenceManagerTestUtils.setUpSimpleReferenceManager(lastSavedSubmissionDirectory, "file");
			// FormDef formDef = parse(formName, "jr://file/last-saved-filled.xml");
			// assertEquals("Form with last-saved instance (blank)", formDef.getTitle());
			// DataInstance lastSaved = formDef.getNonMainInstance("last-saved");
			// AbstractTreeElement root = lastSaved.getRoot();
			// AbstractTreeElement item = root
			// 		.getChild("head", 0)
			// 		.getChild("model", 0)
			// 		.getChild("instance", 0)
			// 		.getChild("data", 0)
			// 		.getChild("item", 0);
			// assertEquals("Foo", item.getValue().getDisplayText());
		});

		it('multipleInstancesFormSavesAndRestores', async () => {
			const scenario = await Scenario.init(r('Simpler_Cascading_Select_Form.xml'));

			expectNoInitializationErrors(scenario);

			// Path serializedForm = getSerializedFormPath(originalFormDef);
			// FormDef deserializedFormDef = deserializeAndCleanUpSerializedForm(serializedForm);

			// assertThat(originalFormDef.getTitle(), is(deserializedFormDef.getTitle()));
		});

		/**
		 * JR:
		 *
		 * ensure serializing and deserializing a range form is done without errors
		 * see https://github.com/getodk/javarosa/issues/245 why this is needed
		 */
		it('rangeFormSavesAndRestores', async () => {
			const scenario = await Scenario.init(r('range-form.xml'));

			expectNoInitializationErrors(scenario);

			// Path serializedForm = getSerializedFormPath(originalFormDef);
			// FormDef deserializedFormDef = deserializeAndCleanUpSerializedForm(serializedForm);

			// assertThat(originalFormDef.getTitle(), is(deserializedFormDef.getTitle()));
		});

		it('parsesRankForm', async () => {
			const scenario = await Scenario.init(r('rank-form.xml'));

			// assertEquals(formDef.getTitle(), "Rank Form");
			// assertEquals(1, formDef.getChildren().size());
			// assertEquals(CONTROL_RANK, ((QuestionDef) formDef.getChild(0)).getControlType());

			// assertNoParseErrors(formDef);
			expectNoInitializationErrors(scenario);
		});

		/**
		 * **PORTING NOTES**
		 *
		 * For now this is redundant to `rangeFormSavesAndRestores`. It's included
		 * and run separately in case we pursue the serde aspects of that test.
		 */
		it('parsesRangeForm', async () => {
			const scenario = await Scenario.init(r('range-form.xml'));

			expectNoInitializationErrors(scenario);
		});

		/**
		 * **PORTING NOTES**
		 *
		 * Parse (and presumably init) expected to fail on form's malformed
		 * definition of the form's `<range>` field. Presumably it is invalid
		 * because its `start` attribute is not a valid numeric/decimal value.
		 *
		 * It's unclear whether a valid `start` attribute value of `"-2.01"` would
		 * be sufficient. The spec language (from
		 * {@link https://www.w3.org/TR/2003/REC-xforms-20031014/slice8.html#ui-range | XForms 1.0})
		 * suggests that `step`...
		 *
		 * > Must be of a type capable of expressing the difference between two
		 * > legal values of the underlying data.
		 *
		 * Would it be valid, given it would produce the steps `…1.49, 1.99, 2.0`?
		 */
		it.fails('throwsParseExceptionOnBadRangeForm', async () => {
			const init = async () => {
				await Scenario.init(r('bad-range-form.xml'));
			};

			await expect(init).rejects.toThrowError(/parse/);
		});

		/**
		 * **PORTING NOTES**
		 *
		 * We do not currently produce an error when a `<select>` or `<select1>` has
		 * no options/items.
		 *
		 * Original notes included a couple open questions (preserved below for
		 * context). Answer
		 * {@link https://github.com/getodk/web-forms/pull/110#discussion_r1614153820 | from review}:
		 *
		 * > This is for the very specific case where a select has no inline choices
		 * > and no valid reference to a secondary instance.
		 *
		 * - - -
		 *
		 * Open questions:
		 *
		 * - Does this expectation apply to `<itemset>`s?
		 *
		 * - If so, does it apply only when the `<itemset>` is inherently empty, or
		 *   would it also be expected to apply if there are filtered items, but the
		 *   filter expression's predicate will never produce any items?
		 */
		it.fails('throwsExceptionOnEmptySelect', async () => {
			// exceptionRule.expect(XFormParseException.class);
			// exceptionRule.expectMessage("Select question 'First' has no choices");

			// Path formName = r("internal_empty_select.xml");
			// FormDef formDef = parse(formName);

			const init = async () => {
				await Scenario.init(r('internal_empty_select.xml'));
			};

			await expect(init).rejects.toThrowError("Select question 'First' has no choices");
		});

		/**
		 * Scenario test. Ported elsewhere.
		 */
		it.skip('formWithCountNonEmptyFunc_ShouldNotThrowException');

		it('parsesMetaNamespaceForm', async () => {
			const scenario = await Scenario.init(r('meta-namespace-form.xml'));

			expectNoInitializationErrors(scenario);
		});

		it('serializeAndRestoreMetaNamespaceFormInstance', async () => {
			// // Given
			// FormDef formDef = parse(r("meta-namespace-form.xml"));
			const scenario = await Scenario.init(r('meta-namespace-form.xml'));

			// assertEquals(formDef.getTitle(), "Namespace for Metadata");

			// assertNoParseErrors(formDef);
			expectNoInitializationErrors(scenario);

			// TreeElement audit = findDepthFirst(formDef.getInstance().getRoot(), AUDIT_NODE);
			// TreeElement audit2 = findDepthFirst(formDef.getInstance().getRoot(), AUDIT_2_NODE);
			// TreeElement audit3 = findDepthFirst(formDef.getInstance().getRoot(), AUDIT_3_NODE);

			// assertNotNull(audit);
			// assertEquals(ORX_2_NAMESPACE_PREFIX, audit.getNamespacePrefix());
			// assertEquals(ORX_2_NAMESPACE_URI, audit.getNamespace());

			// assertNotNull(audit2);
			// assertEquals(ORX_2_NAMESPACE_PREFIX, audit2.getNamespacePrefix());
			// assertEquals(ORX_2_NAMESPACE_URI, audit2.getNamespace());

			// assertNotNull(audit3);
			// assertNull(audit3.getNamespacePrefix());
			// assertNull(audit3.getNamespace());

			// audit.setAnswer(new StringData(AUDIT_ANSWER));
			// audit2.setAnswer(new StringData(AUDIT_2_ANSWER));
			// audit3.setAnswer(new StringData(AUDIT_3_ANSWER));

			// // When

			// // serialize the form instance
			// XFormSerializingVisitor serializer = new XFormSerializingVisitor();
			// ByteArrayPayload xml = (ByteArrayPayload) serializer.createSerializedPayload(formDef.getInstance());
			// copy(xml.getPayloadStream(), FORM_INSTANCE_XML_FILE_NAME, REPLACE_EXISTING);

			// // restore (deserialize) the form instance
			// byte[] formInstanceBytes = readAllBytes(FORM_INSTANCE_XML_FILE_NAME);
			// FormInstance formInstance = XFormParser.restoreDataModel(formInstanceBytes, null);

			// // Then
			// audit = findDepthFirst(formInstance.getRoot(), AUDIT_NODE);
			// audit2 = findDepthFirst(formInstance.getRoot(), AUDIT_2_NODE);
			// audit3 = findDepthFirst(formInstance.getRoot(), AUDIT_3_NODE);

			// assertNotNull(audit);
			// assertEquals(ORX_2_NAMESPACE_PREFIX, audit.getNamespacePrefix());
			// assertEquals(ORX_2_NAMESPACE_URI, audit.getNamespace());
			// assertEquals(AUDIT_ANSWER, audit.getValue().getValue());

			// assertNotNull(audit2);
			// assertEquals(ORX_2_NAMESPACE_PREFIX, audit2.getNamespacePrefix());
			// assertEquals(ORX_2_NAMESPACE_URI, audit2.getNamespace());
			// assertEquals(AUDIT_2_ANSWER, audit2.getValue().getValue());

			// assertNotNull(audit3);
			// assertNull(audit3.getNamespacePrefix());
			// assertNull(audit3.getNamespace());
			// assertEquals(AUDIT_3_ANSWER, audit3.getValue().getValue());
		});

		/**
		 * **PORTING NOTES**
		 *
		 * - Fails with directly ported form fixture, which is missing (at least)
		 *   the `xf` namespace declaration. Unclear whether we should:
		 *
		 *     - Produce an initialization error (form is technically invalid)
		 *
		 *     - Detect the condition and handle silently
		 *
		 *     - Detect the condition and handle gracefully, perhaps with a warning
		 *
		 *     If we do handle it, we should probably do a sanity check that the
		 *     form doesn't have a namespace collision on the `xf` prefix.
		 *
		 * - Parameterized to use an alternate fixture with common namespaces
		 *   present, to demonstrate the test otherwise passe.
		 */
		describe.each<NamespaceOptions>([
			{ includeCommonNamespaces: false },
			{ includeCommonNamespaces: true },
		])('include common namespaces: $includeCommonNamespaces', ({ includeCommonNamespaces }) => {
			let testFn: typeof it | typeof it.fails;

			if (includeCommonNamespaces) {
				testFn = it;
			} else {
				testFn = it.fails;
			}

			testFn('parseFormWithTemplateRepeat', async () => {
				const scenario = await Scenario.init(
					r(includeCommonNamespaces ? 'template-repeat-alt.xml' : 'template-repeat.xml')
				);

				expectNoInitializationErrors(scenario);
			});
		});

		/**
		 * **PORTING NOTES**
		 *
		 * Fails on an engine check for consistency between model and body
		 * structure, where...
		 *
		 * - The model defines a leaf node `<cough/>` corresponding to the node-set
		 *   `/imci/other_treatment/cough`.
		 *
		 * - The body defines a `<group ref="/imci/other_treatment/cough">`.
		 *
		 * The current engine logic expects model leaf nodes to either have:
		 *
		 * - a value/control element in the body
		 * - no body element
		 *
		 * The form also binds several node-sets which would descend from this
		 * `<cough/>` leaf node, but are not present in the model structure.
		 *
		 * It's unclear if this is a pattern we should expect and/or support.
		 *
		 * Also worth noting that at a quick glance, this form fixture is a rare (in
		 * my experience) case where there are body elements with meaningful
		 * structural hierarchy from their model counterparts. The first case
		 * noticed structures:
		 *
		 * ```xml
		 * <group ref="/imci/other_treatment/cough">
		 *   <trigger ref="/imci/other_treatment/info_soothe_throat">...
		 * ```
		 *
		 * Note the trigger's `ref` is outside of the `cough` group's model
		 * hierarchy. I vaguely recall seeing other JavaRosa references to this
		 * possibility. And I also understand it to be valid in the XForms spec. But
		 * this is **another case** (conceptually related, but orthogonal) where
		 * it's unclear whether support for the pattern is in scope.
		 *
		 * If either of these patterns are in scope (or may be in the future), I'd
		 * like to spend more time getting familiar with this fixture (and/or others
		 * known to have similar aspects of form design).
		 */
		it.fails('parseIMCIbyDTreeForm', async () => {
			const scenario = await Scenario.init(r('eIMCI-by-D-Tree.xml'));

			expectNoInitializationErrors(scenario);
		});

		it('parseFormWithSubmissionElement', async () => {
			const scenario = await Scenario.init(r('submission-element.xml'));

			// // Given & When
			// FormDef formDef = parse(r("submission-element.xml"));

			// // Then
			// assertEquals(formDef.getTitle(), "Single Submission Element");

			// assertNoParseErrors(formDef);
			expectNoInitializationErrors(scenario);

			// SubmissionProfile submissionProfile = formDef.getSubmissionProfile();
			// assertEquals("http://some.destination.com", submissionProfile.getAction());
			// assertEquals("form-data-post", submissionProfile.getMethod());
			// assertNull(submissionProfile.getMediaType());
			// assertEquals("/data/text", submissionProfile.getRef().getReference().toString());
		});

		/**
		 * **PORTING NOTES**
		 *
		 * JavaRosa has a limitation, which deviates from (XML!) spec: it will fail
		 * to parse a form where the `<h:body>` precedes `<h:head>`.
		 *
		 * 1. For some reason (probably other aspects of implementation detail?), it
		 *    discusses this limtation in terms of the **model** preceding the body.
		 *    It seemed like this may indicate a structural deviation with the
		 *    `<model>` occurring outside of `<h:head>`, but this is not the case.
		 *
		 * 2. Web forms has no such limitation. As a spec deviation, this test is
		 *    parameterized to demonstrate JavaRosa's failure expectation failing,
		 *    and then actual/expected initialization success.
		 *
		 * - - -
		 *
		 * JR:
		 *
		 * Simple tests that documents assumption that the model has to come before
		 * the body tag. According to the comment above
		 * {@link XFormParser#parseModel(Element)} method, this is not mandated by
		 * the specs but has been implemented this way to keep parsing simpler.
		 */
		describe.each<FailureExpectationOptions>([
			{ disregardJavaRosaFailureExpectation: false },
			{ disregardJavaRosaFailureExpectation: true },
		])(
			'disregard JavaRosa failure expectation: $disregardJavaRosaFailureExpectation',
			({ disregardJavaRosaFailureExpectation }) => {
				if (disregardJavaRosaFailureExpectation) {
					it('parseFormWithBodyBeforeModel', async () => {
						const scenario = await Scenario.init(r('body-before-model.xml'));

						expectNoInitializationErrors(scenario);
					});
				} else {
					it.fails('parseFormWithBodyBeforeModel', async () => {
						const init = async () => {
							await Scenario.init(r('body-before-model.xml'));
						};

						await expect(init).rejects.toThrowError(/parse/);
					});
				}
			}
		);

		/**
		 * **PORTING NOTES**
		 *
		 * Fails on assertions of a completely made up `warnings` interface. We
		 * definitely should produce, and test, warnings for forms like this!
		 */
		it.fails('parseFormWithTwoModels', async () => {
			interface NotARealAPIProposal extends Scenario {
				readonly TODO?: {
					readonly warnings: readonly string[];
				};
			}

			const expectInitializationToProduceWarnings = (
				scenario: NotARealAPIProposal & Scenario,
				expectedWarnings: number
			) => {
				const warnings = scenario.TODO?.warnings ?? [];

				expect.soft(warnings, 'Warnings not implemented.').toHaveLength(expectedWarnings);
			};

			const expectInitializationToProduceWarning = (
				scenario: NotARealAPIProposal & Scenario,
				expectedWarning: string
			) => {
				const warnings = scenario.TODO?.warnings ?? [];

				expect.soft(warnings, 'Warnings not implemented').toContain(expectedWarning);
			};

			const scenario = await Scenario.init(r('two-models.xml'));

			expectNoInitializationErrors(scenario);

			// // Then
			// assertEquals(formDef.getTitle(), "Two Models");
			// List<String> parseWarnings = formDef.getParseWarnings();
			// assertEquals("Number of error messages", 1, parseWarnings.size());

			expectInitializationToProduceWarnings(scenario, 1);

			// assertEquals("XForm Parse Warning: Multiple models not supported. Ignoring subsequent models.\n" +
			// 		"    Problem found at nodeset: /html/head/model\n" +
			// 		"    With element <model><instance><data id=\"second-model\">...\n" +
			// 		"", parseWarnings.get(0));

			expectInitializationToProduceWarning(
				scenario,
				'XForm Parse Warning: Multiple models not supported. Ignoring subsequent models.\n' +
					'    Problem found at nodeset: /html/head/model\n' +
					'    With element <model><instance><data id="second-model">...\n' +
					''
			);

			// String firstModelInstanceId =
			// 		(String) formDef
			// 				.getMainInstance()
			// 				.getRoot()
			// 				.getAttribute(null, "id")
			// 				.getValue()
			// 				.getValue();
			// assertEquals("first-model", firstModelInstanceId);
		});

		it('parseFormWithSetValueAction', async () => {
			const scenario = await Scenario.init(r('form-with-setvalue-action.xml'));

			expectNoInitializationErrors(scenario);

			// // dispatch 'odk-instance-first-load' event (Actions.EVENT_ODK_INSTANCE_FIRST_LOAD)
			// formDef.initialize(true, new InstanceInitializationFactory());

			// // Then
			// assertEquals(formDef.getTitle(), "SetValue action");
			// assertNoParseErrors(formDef);
			// assertEquals(1, formDef.getActionController().getListenersForEvent(Actions.EVENT_ODK_INSTANCE_FIRST_LOAD).size());

			// TreeElement textNode =
			// 		formDef.getMainInstance().getRoot().getChildrenWithName("text").get(0);

			// assertEquals("Test Value", textNode.getValue().getValue());
		});

		/**
		 * **PORTING NOTES**
		 *
		 * Adds basic assertion for inclusion of group in form state.
		 */
		it('parseGroupWithNodesetAttrForm', async () => {
			const scenario = await Scenario.init(r('group-with-nodeset-attr.xml'));

			expectNoInitializationErrors(scenario);

			expect(scenario.getInstanceNode('/data/R1[1]/G2')).toMatchObject({
				nodeType: 'group',
			});

			// // Then
			// assertEquals(formDef.getTitle(), "group with nodeset attribute");
			// assertEquals("Number of error messages", 0, formDef.getParseErrors().size());

			// final TreeReference expectedTreeReference = new TreeReference();
			// expectedTreeReference.setRefLevel(-1); // absolute reference
			// expectedTreeReference.add("data", -1); // the instance root
			// expectedTreeReference.add("R1", -1); // the outer repeat
			// expectedTreeReference.add("G2", -1); // the inner group
			// final IDataReference expectedXPathReference = new XPathReference(expectedTreeReference);

			// IFormElement groupElement = formDef.getChild(0).getChild(0);

			// assertThat(groupElement, instanceOf(GroupDef.class));
			// assertThat(((GroupDef) groupElement).getRepeat(), is(false));
			// assertThat(groupElement.getBind(), is(expectedXPathReference));
		});

		/**
		 * **PORTING NOTES**
		 *
		 * Adds basic assertion for inclusion of groups in form state.
		 */
		it('parseGroupWithRefAttrForm', async () => {
			const scenario = await Scenario.init(r('group-with-ref-attr.xml'));

			expectNoInitializationErrors(scenario);

			expect(scenario.getInstanceNode('/data/G1')).toMatchObject({
				nodeType: 'group',
			});
			expect(scenario.getInstanceNode('/data/G1/G3')).toMatchObject({
				nodeType: 'group',
			});

			// // Then
			// assertEquals(formDef.getTitle(), "group with ref attribute");
			// assertEquals("Number of error messages", 0, formDef.getParseErrors().size());

			// final TreeReference g2TreeRef = new TreeReference();
			// g2TreeRef.setRefLevel(-1); // absolute reference
			// g2TreeRef.add("data", -1); // the instance root
			// g2TreeRef.add("G1", -1); // the outer group
			// g2TreeRef.add("G2", -1); // the inner group

			// // G2 does NOT have a `ref`.
			// // Collect implicitly assumes the TreeReference will be created like this.
			// IDataReference g2AbsRef = FormDef.getAbsRef(null, g2TreeRef.getParentRef());

			// IFormElement g2Element = formDef.getChild(0).getChild(0);
			// assertThat(g2Element.getBind(), is(g2AbsRef));

			// final TreeReference g3TreeRef = new TreeReference();
			// g3TreeRef.setRefLevel(-1); // absolute reference
			// g3TreeRef.add("data", -1); // the instance root
			// g3TreeRef.add("G1", -1); // the outer group
			// g3TreeRef.add("G3", -1); // the inner group

			// // G3 has a `ref`.
			// // Collect implicitly assumes the TreeReference will be created like this.
			// IDataReference g3AbsRef = FormDef.getAbsRef(new XPathReference(g3TreeRef), g3TreeRef.getParentRef());

			// IFormElement g3Element = formDef.getChild(0).getChild(1);
			// assertThat(g3Element.getBind(), is(g3AbsRef));
		});

		/**
		 * Scenario test. Ported elsewhere.
		 */
		it.skip('testSetValueWithStrings');
	});
});

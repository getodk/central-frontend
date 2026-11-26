import { describe, expect, it } from 'vitest';
import { stringAnswer } from '../../scenario/answer/ExpectedStringAnswer.ts';
import { Scenario } from '../../scenario/jr/Scenario.ts';

import simple from '../../scenario/fixtures/test-javarosa/resources/simple-form.xml?raw';
import secondaryInstance from '../../scenario/fixtures/test-javarosa/resources/secondary-instance.xml?raw';
import internalSelect10 from '../../scenario/fixtures/test-javarosa/resources/internal_select_10.xml?raw';
import lastSavedBlank from '../../scenario/fixtures/test-javarosa/resources/last-saved-blank.xml?raw';
import simplerCascadingSelect from '../../scenario/fixtures/test-javarosa/resources/Simpler_Cascading_Select_Form.xml?raw';
import range from '../../scenario/fixtures/test-javarosa/resources/range-form.xml?raw';
import rank from '../../scenario/fixtures/test-javarosa/resources/rank-form.xml?raw';
import badRange from '../../scenario/fixtures/test-javarosa/resources/bad-range-form.xml?raw';
import internalEmptySelect from '../../scenario/fixtures/test-javarosa/resources/internal_empty_select.xml?raw';
import metaNamespace from '../../scenario/fixtures/test-javarosa/resources/meta-namespace-form.xml?raw';
import templateRepeat from '../../scenario/fixtures/test-javarosa/resources/template-repeat.xml?raw';
import eIMCI from '../../scenario/fixtures/test-javarosa/resources/eIMCI-by-D-Tree.xml?raw';
import submissionElement from '../../scenario/fixtures/test-javarosa/resources/submission-element.xml?raw';
import bodyBeforeModel from '../../scenario/fixtures/test-javarosa/resources/body-before-model.xml?raw';
import twoModels from '../../scenario/fixtures/test-javarosa/resources/two-models.xml?raw';
import setvalueAction from '../../scenario/fixtures/test-javarosa/resources/form-with-setvalue-action.xml?raw';
import groupWithNodeset from '../../scenario/fixtures/test-javarosa/resources/group-with-nodeset-attr.xml?raw';
import groupWithRef from '../../scenario/fixtures/test-javarosa/resources/group-with-ref-attr.xml?raw';

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
 *   porting notes.
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
  describe('parse', () => {
    it('simple form', async () => {
      await Scenario.init(simple);
    });

    /**
     * **PORTING NOTES**
     *
     * It's unclear why `SECONDARY_INSTANCE_XML` is defined in the
     * `@Before`/`setUp` method in the JavaRosa "vat". Since it's only
     * referenced by this test, we define it locally for now.
     */
    it('form with secondary instance', async () => {
      await Scenario.init(secondaryInstance);
    });

    it('form with internal select', async () => {
      await Scenario.init(internalSelect10);
    });

    it('parses last saved instance with null src', async () => {
      const scenario = await Scenario.init(lastSavedBlank);
      expect(scenario.answerOf('/data/item')).toEqualAnswer(stringAnswer('')); // nothing to bind from the last-saved instance
    });

    it('parses last saved instance with filled form', async () => {
      const lastSavedXml = `
        <data id="data">
          <item>Foo</item>
          <meta>
            <instanceID/>
          </meta>
        </data>`;

      const scenario = await Scenario.init(lastSavedBlank, { lastSavedXml });
      expect(scenario.answerOf('/data/item')).toEqualAnswer(stringAnswer('Foo'));
    });

    it('ignores last saved instance when editing form', async () => {
      const lastSavedXml = `
        <data id="data">
          <item>Foo</item>
          <meta>
            <instanceID/>
          </meta>
        </data>`;
      const editInstance = `
        <data id="data">
          <item></item>
          <meta>
            <instanceID/>
          </meta>
        </data>`;

      const scenario = await Scenario.init(lastSavedBlank, { lastSavedXml, editInstance });
      expect(scenario.answerOf('/data/item')).toEqualAnswer(stringAnswer(''));
    });

    it('save and restore cascading select', async () => {
      const scenario = await Scenario.init(simplerCascadingSelect);
      expect(scenario.getTitle()).toBe('Simpler Cascading Select Form');
      const restored = await scenario.serializeAndRestoreInstanceState();
      expect(restored.getTitle()).toBe('Simpler Cascading Select Form');
    });

    it('save and restore range', async () => {
      const scenario = await Scenario.init(range);
      expect(scenario.getTitle()).toBe('Form with a Range');
      const restored = await scenario.serializeAndRestoreInstanceState();
      expect(restored.getTitle()).toBe('Form with a Range');
    });

    it('form with rank rank', async () => {
      const scenario = await Scenario.init(rank);
      expect(scenario.getTitle()).toBe('Rank Form');
      scenario.next('/data/rankWidget');
    });

    it('init throws on invalid range attribute', async () => {
      const init = async () => {
        await Scenario.init(badRange);
      };

      await expect(init).rejects.toThrow(
        'Expected attribute start to be defined with numeric string, got: "-2.0.1"'
      );
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
        await Scenario.init(internalEmptySelect);
      };

      await expect(init).rejects.toThrow("Select question 'First' has no choices");
    });

    it('form with meta namespace', async () => {
      await Scenario.init(metaNamespace);
    });

    it('save and restore form with meta namespace', async () => {
      // // Given
      // FormDef formDef = parse(r("meta-namespace-form.xml"));
      await Scenario.init(metaNamespace);

      // assertEquals(formDef.getTitle(), "Namespace for Metadata");

      // assertNoParseErrors(formDef);

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

    it('throws when xforms namespace not defined', async () => {
      const init = async () => {
        await Scenario.init(templateRepeat);
      };

      await expect(init).rejects.toThrow('Failed to evaluate node for expression ./xf:model');
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
     */
    it('throws when parsing a form with inconsistency between model and body', async () => {
      const init = async () => {
        await Scenario.init(eIMCI);
      };

      await expect(init).rejects.toThrow(
        'Unexpected body element for nodeset /imci/other_treatment/cough'
      );
    });

    it('parseFormWithSubmissionElement', async () => {
      await Scenario.init(submissionElement);

      // // Given & When
      // FormDef formDef = parse(r("submission-element.xml"));

      // // Then
      // assertEquals(formDef.getTitle(), "Single Submission Element");

      // assertNoParseErrors(formDef);

      // SubmissionProfile submissionProfile = formDef.getSubmissionProfile();
      // assertEquals("http://some.destination.com", submissionProfile.getAction());
      // assertEquals("form-data-post", submissionProfile.getMethod());
      // assertNull(submissionProfile.getMediaType());
      // assertEquals("/data/text", submissionProfile.getRef().getReference().toString());
    });

    /**
     * JavaRosa has a limitation, which deviates from (XML!) spec: it will fail
     * to parse a form where the `<h:body>` precedes `<h:head>`.
     */
    it('allows form to define body before model', async () => {
      await Scenario.init(bodyBeforeModel);
    });

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

      const scenario = await Scenario.init(twoModels);

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

    it('form with a setvalue action', async () => {
      const scenario = await Scenario.init(setvalueAction);

      expect(scenario.answerOf('/data/text')).toEqualAnswer(stringAnswer('Test Value'));
    });

    it('group with nodeset', async () => {
      const scenario = await Scenario.init(groupWithNodeset);
      expect(scenario.getInstanceNode('/data/R1[1]/G2')).toMatchObject({
        nodeType: 'group',
      });
    });

    it('group with ref', async () => {
      const scenario = await Scenario.init(groupWithRef);
      expect(scenario.getInstanceNode('/data/G1')).toMatchObject({
        nodeType: 'group',
      });
      expect(scenario.getInstanceNode('/data/G1/G3')).toMatchObject({
        nodeType: 'group',
      });
    });
  });
});

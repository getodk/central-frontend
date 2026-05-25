import { describe, it } from 'vitest';

/**
 * **PORTING NOTES**
 *
 * We've deferred porting tests of Entities functionality, pending further
 * exploration of the feature requirements and implications for pertinent APIs.
 * To avoid future confusion about porting status, all Entities test
 * descriptions are included verbatim, marked as `.todo` tests.
 */
describe.todo('Entities', () => {
	describe.todo('EntitiesTest.java', () => {
		it.todo('fillingFormWithoutCreate_doesNotCreateAnyEntities');
		it.todo('fillingFormWithCreate_makesEntityAvailable');
		it.todo('fillingFormWithUpdate_makesEntityAvailable');
		it.todo('fillingFormWithUpdate_andNoLabel_makesEntityAvailableWithNullLabel');
		it.todo('fillingFormWithCreateAndUpdate_makesEntityAvailableAsSecondVersion');
		it.todo('fillingFormWithCreateAndUpdate_butNoBaseVersion_makesEntityAvailableAsFirstVersion');
		it.todo('fillingFormWithDynamicCreateExpression_conditionallyCreatesEntities');
		it.todo('entityFormCanBeSerialized');
		it.todo('entitiesNamespaceWorksRegardlessOfName');
		it.todo('fillingFormWithSelectSaveTo_andWithCreate_savesValuesCorrectlyToEntity');
		it.todo('whenSaveToQuestionIsNotAnswered_entityPropertyIsEmptyString');
		it.todo('savetoIsRemovedFromBindAttributesForClients');
	});

	/**
	 * **PORTING NOTES**
	 *
	 * Note that this test "vat" is in an internal directory in JavaRosa. These
	 * may turn out to be less pertinent than other pending tests.
	 */
	describe.todo('EntityFormParseProcessorTest.java', () => {
		it.todo('whenVersionIsMissing_parsesWithoutError');
		it.todo('whenVersionIsMissing_andThereIsAnEntityElement_throwsException');
		it.todo('whenVersionIsNewPatch_parsesCorrectly');
		it.todo('whenVersionIsNewVersionWithUpdates_parsesCorrectly');
		it.todo('saveTosWithIncorrectNamespaceAreIgnored');
	});

	describe.todo('EntityFormFinalizationProcessorTest.java', () => {
		it.todo('whenFormDoesNotHaveEntityElement_addsNoEntitiesToExtras');
	});

	describe.todo('EntityFormParserTest.java', () => {
		it.todo('parseAction_findsCreateWithTrueString');
		it.todo('parseAction_findsUpdateWithTrueString');
	});
});

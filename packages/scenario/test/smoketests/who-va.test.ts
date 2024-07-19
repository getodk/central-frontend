import { describe, expect, it } from 'vitest';
import { expectedFractionalDays } from '../../src/answer/ExpectedApproximateUOMAnswer.ts';
import { intAnswer } from '../../src/answer/ExpectedIntAnswer.ts';
import { stringAnswer } from '../../src/answer/ExpectedStringAnswer.ts';
import { LocalDate } from '../../src/java/time/LocalDate.ts';
import { Scenario } from '../../src/jr/Scenario.ts';
import { r } from '../../src/jr/resource/ResourcePathHelper.ts';

/**
 * **PORTING NOTES**
 *
 * - Ported tests reference the 2016 version of this form. We should consider
 *   adapting and/or adding tests for later versions of the form, which exercise
 *   additional functionality. For instnace, we also have access to the 2022
 *   version, which also exercises `<setvalue>` actions (and potentially more).
 *
 * - Rather than extending {@link Scenario.next} to accept an `amount`
 *   parameter, we call it for each expected node-set reference. This is more
 *   consistent with most other usage throughout ported tests. An alternative
 *   was considered accepting both an `amount` and an array of expected
 *   references, but that didn't seem to add much (beyond an unnecessary
 *   overload) versus this usage. In cases where there are a large number of
 *   questions covered by JavaRosa's `amount` usage, an array of references is
 *   created, its length compared to ensure it matches JavaRosa's `amount`, and
 *   then the array is iterated to progress through that section of the form.
 *
 * - It seems there may be a mistake in JavaRosa's comments specifying the
 *   expected question label/node-set references: after `Id10022` the comments
 *   suggest the next question will be `Id10021` (which is the **previous**
 *   question). Test failed when asserting that reference, but passes when
 *   asserting `Id10023_a` (which is the next question in the form definition,
 *   both within the model and body). I'm confident enough that this is a
 *   mistake to skip parameterization showing both, and to recommend updating
 *   the comment in JavaRosa. (Both label/reference pairs are included in
 *   comments here.)
 */
describe('WHO VA fixture(s): smoketests', () => {
	describe('WhoVATest.java', () => {
		describe('regression after [JavaRosa] 2.17.0', () => {
			it('[updates `relevant` state] relevance updates', async () => {
				const scenario = await Scenario.init(r('whova_form.xml'));

				// region Give consent to unblock the rest of the form
				// (Id10013) [Did the respondent give consent?] ref:/data/respondent_backgr/Id10013

				// JR:
				//
				// scenario.next(14);

				scenario.next('/data/presets');
				scenario.next('/data/presets/Id10002');
				scenario.next('/data/presets/Id10003');
				scenario.next('/data/presets/Id10004');
				scenario.next('/data/respondent_backgr');
				scenario.next('/data/respondent_backgr/Id10007');
				scenario.next('/data/respondent_backgr/Id10007a');
				scenario.next('/data/respondent_backgr/Id10008');
				scenario.next('/data/respondent_backgr/Id10009');
				scenario.next('/data/respondent_backgr/Id10010');
				scenario.next('/data/respondent_backgr/Id10010a');
				scenario.next('/data/respondent_backgr/Id10010b');
				scenario.next('/data/respondent_backgr/Id10010c');
				scenario.next('/data/respondent_backgr/Id10013');

				scenario.answer('yes');

				// endregion

				// region Info on deceased
				// (Id10019) What was the sex of the deceased? ref:/data/consented/deceased_CRVS/info_on_deceased/Id10019

				// JR:
				//
				// scenario.next(6);

				scenario.next('/data/consented');
				scenario.next('/data/consented/deceased_CRVS');
				scenario.next('/data/consented/deceased_CRVS/info_on_deceased');
				scenario.next('/data/consented/deceased_CRVS/info_on_deceased/Id10017');
				scenario.next('/data/consented/deceased_CRVS/info_on_deceased/Id10018');
				scenario.next('/data/consented/deceased_CRVS/info_on_deceased/Id10019');

				scenario.answer('female');

				// (Id10020) Is the date of birth known? ref:/data/consented/deceased_CRVS/info_on_deceased/Id10020
				scenario.next('/data/consented/deceased_CRVS/info_on_deceased/Id10020');
				scenario.answer('yes');

				// (Id10021) When was the deceased born? ref:/data/consented/deceased_CRVS/info_on_deceased/Id10021
				scenario.next('/data/consented/deceased_CRVS/info_on_deceased/Id10021');
				scenario.answer(LocalDate.parse('1998-01-01'));

				// (Id10022) Is the date of death known? ref:/data/consented/deceased_CRVS/info_on_deceased/Id10022
				scenario.next('/data/consented/deceased_CRVS/info_on_deceased/Id10022');
				scenario.answer('yes');

				// JR: (Id10021) When was the deceased born? ref:/data/consented/deceased_CRVS/info_on_deceased/Id10021
				// Actual(?): (Id10023_a) When did (s)he die?
				scenario.next('/data/consented/deceased_CRVS/info_on_deceased/Id10023_a');
				scenario.answer(LocalDate.parse('2018-01-01'));
				// endregion

				/*
				 * JR:
				 *
				 * Regression happens here: we changed FormInstanceParser to add all descendants of a group as targets
				 * of a relevance condition defined in that group.
				 *
				 * When a field inside the group has also a relevance condition, then we have two equipotent condition
				 * triggerables in the DAG that will update the field's relevance, which may set it in unexpected ways.
				 * In this form, the Id10120_0 should be irrelevant at this point, but some relevance expression
				 * declared in an ancestor group is making it relevant.
				 *
				 * In v2.17.0, we compute the descendant targets just in time, which makes the condition triggerables
				 * not equipotent, ensuring that the one declared in the field will be evaluated last, producing the
				 * expected relevance state.
				 */
				expect(
					scenario.getInstanceNode('/data/consented/illhistory/illdur/Id10120_0')
				).toBeNonRelevant();
			});
		});

		/**
		 * **PORTING NOTES**
		 *
		 * - All of the assertions of expected references at particular points in
		 *   positional state are redundant to the checks performed by our extension
		 *   of {@link Scenario.next}. They've been preserved but commented out.
		 *   This also eliminates the need for these tests to reference
		 *   `TreeReference.genericize` (allowing us to keep those extensions in the
		 *   adjacent `child-vaccination.test.ts` for now).
		 *
		 * - Test fails on assertion of the value at
		 *   `/data/consented/deceased_CRVS/info_on_deceased/ageInDays`. This is
		 *   almost certainly a loss of float precision in the comparison. It's
		 *   unclear whether this should be treated as a bug. My understanding,
		 *   revisiting (albeit skimming for now) the pertinent aspects of the ODK
		 *   XForms and XPath 1.0 specs suggests that it's likely the values should
		 *   be treated as numbers (without additional qualification, per ODK
		 *   XForms), which in turn should be treated as IEEE-754 double-precision
		 *   floats (XPath 1.0). The expression reduces to an expression with format
		 *   YYYY-MM-DD - YYYY-MM-DD. The fractional day numeric values of each,
		 *   when subtracted, produce imprecision in JavaScript's runtime float
		 *   representation (which is IEEE-754 double; that being consistent with
		 *   XPath 1.0 is the reason there isn't currently much effort to address
		 *   precision).
		 *
		 * - Test further fails on writes to some fields—where portions of the test
		 *   loop through large portions of the form state, answering "no" to each
		 *   answer in series—where writes produce an error because those fields
		 *   have a `readonly: true` state. Since we have now implemented an
		 *   explicit 'note' node type, we have now confirmed that in each case, the
		 *   node is considered a 'note': it will always be readonly, and any
		 *   attempted write will fail.
		 *
		 * - The test is parameterized to demonstrate failure without accommodation
		 *   for these issues, and passage when the assertion of `ageInDays` has
		 *   slightly relaxed precision and when there's a guard preventing attempts
		 *   to write values to 'note' nodes.
		 *
		 * - In the last long sequence of iterate-and-answer-"no" steps, several of
		 *   the questions' node-set references only become available (i.e. those
		 *   questions become relevant) as earlier answers in that sequence are
		 *   answered. Those are called out with comments grouping them together, as
		 *   potential candidates for additional assertions of their `relevant`
		 *   state changes. I don't know if we'd get more value by adding those, but
		 *   given the test and its fixture are already so long, I don't think it
		 *   could hurt to add more coverage (e.g. to guard against regressions)
		 *   around additional state changes we've already identified in the course
		 *   of porting the test.
		 */
		describe('smoke test: route, fever, and lumps', () => {
			interface SmokeTestOptions {
				readonly relaxCalculatedDateArithmeticPrecision: boolean;
				readonly skipWritesToNoteNodes: boolean;
			}

			describe.each<SmokeTestOptions>([
				{
					relaxCalculatedDateArithmeticPrecision: false,
					skipWritesToNoteNodes: false,
				},
				{
					relaxCalculatedDateArithmeticPrecision: true,
					skipWritesToNoteNodes: true,
				},
			])(
				'relax calculated date arithmetic precision: $relaxCalculatedDateArithmeticPrecision;  skip writes to note nodes: $skipWritesToNoteNodes',
				({ relaxCalculatedDateArithmeticPrecision, skipWritesToNoteNodes }) => {
					let testFn: typeof it | typeof it.fails;

					if (relaxCalculatedDateArithmeticPrecision && skipWritesToNoteNodes) {
						testFn = it;
					} else {
						testFn = it.fails;
					}

					testFn('progresses through the form', async () => {
						const scenario = await Scenario.init(r('whova_form.xml'));

						// region Give consent to unblock the rest of the form
						// (Id10013) [Did the respondent give consent?] ref:/data/respondent_backgr/Id10013

						// JR:
						//
						// scenario.next(14);
						// assertThat(scenario.refAtIndex().genericize(), is(getRef("/data/respondent_backgr/Id10013")));

						scenario.next('/data/presets');
						scenario.next('/data/presets/Id10002');
						scenario.next('/data/presets/Id10003');
						scenario.next('/data/presets/Id10004');
						scenario.next('/data/respondent_backgr');
						scenario.next('/data/respondent_backgr/Id10007');
						scenario.next('/data/respondent_backgr/Id10007a');
						scenario.next('/data/respondent_backgr/Id10008');
						scenario.next('/data/respondent_backgr/Id10009');
						scenario.next('/data/respondent_backgr/Id10010');
						scenario.next('/data/respondent_backgr/Id10010a');
						scenario.next('/data/respondent_backgr/Id10010b');
						scenario.next('/data/respondent_backgr/Id10010c');
						scenario.next('/data/respondent_backgr/Id10013');

						scenario.answer('yes');
						// endregion

						// region Info on deceased
						// (Id10019) What was the sex of the deceased? ref:/data/consented/deceased_CRVS/info_on_deceased/Id10019

						// JR:
						//
						// scenario.next(6);
						// assertThat(scenario.refAtIndex().genericize(), is(getRef("/data/consented/deceased_CRVS/info_on_deceased/Id10019")));

						// JR:
						//
						// scenario.next(6);

						scenario.next('/data/consented');
						scenario.next('/data/consented/deceased_CRVS');
						scenario.next('/data/consented/deceased_CRVS/info_on_deceased');
						scenario.next('/data/consented/deceased_CRVS/info_on_deceased/Id10017');
						scenario.next('/data/consented/deceased_CRVS/info_on_deceased/Id10018');
						scenario.next('/data/consented/deceased_CRVS/info_on_deceased/Id10019');

						scenario.answer('female');

						// (Id10020) Is the date of birth known? ref:/data/consented/deceased_CRVS/info_on_deceased/Id10020
						scenario.next('/data/consented/deceased_CRVS/info_on_deceased/Id10020');
						scenario.answer('yes');

						// (Id10021) When was the deceased born? ref:/data/consented/deceased_CRVS/info_on_deceased/Id10021
						scenario.next('/data/consented/deceased_CRVS/info_on_deceased/Id10021');
						scenario.answer(LocalDate.parse('1998-01-01'));

						// (Id10022) Is the date of death known? ref:/data/consented/deceased_CRVS/info_on_deceased/Id10022
						// This question triggers one of the longest evaluation chain of triggerables including 5 calculations
						scenario.next('/data/consented/deceased_CRVS/info_on_deceased/Id10022');
						scenario.answer('yes');

						// JR: (Id10021) When was the deceased born? ref:/data/consented/deceased_CRVS/info_on_deceased/Id10021
						// Actual(?): (Id10023_a) When did (s)he die?
						scenario.next('/data/consented/deceased_CRVS/info_on_deceased/Id10023_a');
						scenario.answer(LocalDate.parse('2018-01-01'));

						// Sanity check about age and isAdult field
						if (relaxCalculatedDateArithmeticPrecision) {
							expect(
								scenario.answerOf('/data/consented/deceased_CRVS/info_on_deceased/ageInDays')
							).toHaveAnswerCloseTo(expectedFractionalDays(7305, 1e-10));
						} else {
							expect(
								scenario.answerOf('/data/consented/deceased_CRVS/info_on_deceased/ageInDays')
							).toEqualAnswer(intAnswer(7305));
						}
						expect(
							scenario.answerOf('/data/consented/deceased_CRVS/info_on_deceased/isAdult')
						).toEqualAnswer(stringAnswer('1'));
						expect(
							scenario.answerOf('/data/consented/deceased_CRVS/info_on_deceased/isNeonatal')
						).toEqualAnswer(stringAnswer('0'));

						// Skip a bunch of non yes/no questions

						// JR:
						//
						// scenario.next(11);
						// assertThat(
						// 	scenario.refAtIndex().genericize(),
						// 	is(getRef('/data/consented/illhistory/illdur/id10120_unit'))
						// );

						scenario.next('/data/consented/deceased_CRVS/info_on_deceased/displayAgeAdult');
						scenario.next('/data/consented/deceased_CRVS/info_on_deceased/Id10058');
						scenario.next('/data/consented/deceased_CRVS/info_on_deceased/Id10051');
						scenario.next('/data/consented/deceased_CRVS/info_on_deceased/Id10059');
						scenario.next('/data/consented/deceased_CRVS/vital_reg_certif');
						scenario.next('/data/consented/deceased_CRVS/vital_reg_certif/Id10069');
						scenario.next('/data/consented/injuries_accidents');
						scenario.next('/data/consented/injuries_accidents/Id10077');
						scenario.next('/data/consented/illhistory');
						scenario.next('/data/consented/illhistory/illdur');
						scenario.next('/data/consented/illhistory/illdur/id10120_unit');

						// JR: Answer no to the rest of questions
						// Actual: Answer no to the next 23 questions

						const next23References = [
							'/data/consented/illhistory/Id10123',
							'/data/consented/illhistory/med_hist_final_illness',
							'/data/consented/illhistory/med_hist_final_illness/Id10125',
							'/data/consented/illhistory/med_hist_final_illness/Id10126',
							'/data/consented/illhistory/med_hist_final_illness/Id10127',
							'/data/consented/illhistory/med_hist_final_illness/Id10128',
							'/data/consented/illhistory/med_hist_final_illness/Id10129',
							'/data/consented/illhistory/med_hist_final_illness/Id10130',
							'/data/consented/illhistory/med_hist_final_illness/Id10131',
							'/data/consented/illhistory/med_hist_final_illness/Id10132',
							'/data/consented/illhistory/med_hist_final_illness/Id10133',
							'/data/consented/illhistory/med_hist_final_illness/Id10134',
							'/data/consented/illhistory/med_hist_final_illness/Id10135',
							'/data/consented/illhistory/med_hist_final_illness/Id10136',
							'/data/consented/illhistory/med_hist_final_illness/Id10137',
							'/data/consented/illhistory/med_hist_final_illness/Id10138',
							'/data/consented/illhistory/med_hist_final_illness/Id10139',
							'/data/consented/illhistory/med_hist_final_illness/Id10140',
							'/data/consented/illhistory/med_hist_final_illness/Id10141',
							'/data/consented/illhistory/med_hist_final_illness/Id10142',
							'/data/consented/illhistory/med_hist_final_illness/Id10143',
							'/data/consented/illhistory/med_hist_final_illness/Id10144',
							'/data/consented/illhistory/signs_symptoms_final_illness',
						];

						expect(next23References.length).toBe(23);

						next23References.forEach((expectedReference) => {
							scenario.next(expectedReference);

							if (scenario.atQuestion()) {
								scenario.answer('no');
							}
						});
						// endregion

						// region Signs and symptoms - fever
						// (Id10147) Did (s)he have a fever? ref:/data/consented/illhistory/signs_symptoms_final_illness/Id10147
						scenario.next('/data/consented/illhistory/signs_symptoms_final_illness/Id10147');
						// assertThat(
						// 	scenario.refAtIndex().genericize(),
						// 	is(getRef('/data/consented/illhistory/signs_symptoms_final_illness/Id10147'))
						// );

						scenario.answer('yes');

						// (Id10148_units) How long did the fever last? ref:/data/consented/illhistory/signs_symptoms_final_illness/Id10148_units
						scenario.next('/data/consented/illhistory/signs_symptoms_final_illness/Id10148_units');
						scenario.answer('days');

						// (Id10148_b) [Enter how long the fever lasted in days]: ref:/data/consented/illhistory/signs_symptoms_final_illness/Id10148_b
						scenario.next('/data/consented/illhistory/signs_symptoms_final_illness/Id10148_b');
						scenario.answer(30);

						// (Id10149) Did the fever continue until death? ref:/data/consented/illhistory/signs_symptoms_final_illness/Id10149
						scenario.next('/data/consented/illhistory/signs_symptoms_final_illness/Id10149');
						scenario.answer('yes');

						// (Id10150) How severe was the fever? ref:/data/consented/illhistory/signs_symptoms_final_illness/Id10150
						scenario.next('/data/consented/illhistory/signs_symptoms_final_illness/Id10150');
						scenario.answer('severe');

						// (Id10151) What was the pattern of the fever? ref:/data/consented/illhistory/signs_symptoms_final_illness/Id10151
						scenario.next('/data/consented/illhistory/signs_symptoms_final_illness/Id10151');
						scenario.answer('nightly');
						// assertThat(
						// 	scenario.refAtIndex().genericize(),
						// 	is(getRef('/data/consented/illhistory/signs_symptoms_final_illness/Id10151'))
						// );
						// endregion

						// region Answer "no" until we get to the lumps group

						// JR:
						//
						// IntStream.range(0, 36).forEach((n) => {
						// 	scenario.next();
						// 	if (scenario.atQuestion()) scenario.answer('no');
						// });
						const next36References = [
							'/data/consented/illhistory/signs_symptoms_final_illness/Id10152',
							'/data/consented/illhistory/signs_symptoms_final_illness/Id10153',
							'/data/consented/illhistory/signs_symptoms_final_illness/Id10159',
							'/data/consented/illhistory/signs_symptoms_final_illness/Id10166',
							'/data/consented/illhistory/signs_symptoms_final_illness/Id10168',
							'/data/consented/illhistory/signs_symptoms_final_illness/Id10173_a',
							'/data/consented/illhistory/signs_symptoms_final_illness/Id10174',
							'/data/consented/illhistory/signs_symptoms_final_illness/Id10181',
							'/data/consented/illhistory/signs_symptoms_final_illness/Id10186',
							'/data/consented/illhistory/signs_symptoms_final_illness/Id10188',
							'/data/consented/illhistory/signs_symptoms_final_illness/Id10189',
							'/data/consented/illhistory/signs_symptoms_final_illness/Id10193',
							'/data/consented/illhistory/signs_symptoms_final_illness/Id10194',
							'/data/consented/illhistory/signs_symptoms_final_illness/Id10200',
							'/data/consented/illhistory/signs_symptoms_final_illness/Id10204',
							'/data/consented/illhistory/signs_symptoms_final_illness/Id10207',
							'/data/consented/illhistory/signs_symptoms_final_illness/Id10208',
							'/data/consented/illhistory/signs_symptoms_final_illness/Id10210',
							'/data/consented/illhistory/signs_symptoms_final_illness/Id10212',
							'/data/consented/illhistory/signs_symptoms_final_illness/Id10214',
							'/data/consented/illhistory/signs_symptoms_final_illness/Id10219',
							'/data/consented/illhistory/signs_symptoms_final_illness/Id10223',
							'/data/consented/illhistory/signs_symptoms_final_illness/Id10227',
							'/data/consented/illhistory/signs_symptoms_final_illness/Id10228',
							'/data/consented/illhistory/signs_symptoms_final_illness/Id10230',
							'/data/consented/illhistory/signs_symptoms_final_illness/Id10233',
							'/data/consented/illhistory/signs_symptoms_final_illness/Id10237',
							'/data/consented/illhistory/signs_symptoms_final_illness/Id10238',
							'/data/consented/illhistory/signs_symptoms_final_illness/Id10241',
							'/data/consented/illhistory/signs_symptoms_final_illness/Id10243',
							'/data/consented/illhistory/signs_symptoms_final_illness/Id10244',
							'/data/consented/illhistory/signs_symptoms_final_illness/Id10245',
							'/data/consented/illhistory/signs_symptoms_final_illness/Id10246',
							'/data/consented/illhistory/signs_symptoms_final_illness/Id10247',
							'/data/consented/illhistory/signs_symptoms_final_illness/Id10249',
							'/data/consented/illhistory/signs_symptoms_final_illness/Id10252',
						];

						expect(next36References.length).toBe(36);

						next36References.forEach((expectedReference) => {
							scenario.next(expectedReference);

							if (scenario.atQuestion()) {
								scenario.answer('no');
							}
						});
						// endregion

						// region Signs and symptoms - lumps
						// (Id10253) Did (s)he have any lumps? ref:/data/consented/illhistory/signs_symptoms_final_illness/Id10253
						scenario.next('/data/consented/illhistory/signs_symptoms_final_illness/Id10253');
						// assertThat(
						// 	scenario.refAtIndex().genericize(),
						// 	is(getRef('/data/consented/illhistory/signs_symptoms_final_illness/Id10253'))
						// );
						scenario.answer('yes');

						// (Id10254) Did (s)he have any lumps or lesions in the mouth? ref:/data/consented/illhistory/signs_symptoms_final_illness/Id10254
						scenario.next('/data/consented/illhistory/signs_symptoms_final_illness/Id10254');
						scenario.answer('yes');

						// (Id10255) Did (s)he have any lumps on the neck? ref:/data/consented/illhistory/signs_symptoms_final_illness/Id10255
						scenario.next('/data/consented/illhistory/signs_symptoms_final_illness/Id10255');
						scenario.answer('yes');

						// (Id10256) Did (s)he have any lumps on the armpit? ref:/data/consented/illhistory/signs_symptoms_final_illness/Id10256
						scenario.next('/data/consented/illhistory/signs_symptoms_final_illness/Id10256');
						scenario.answer('yes');

						// (Id10257) Did (s)he have any lumps on the groin? ref:/data/consented/illhistory/signs_symptoms_final_illness/Id10257
						scenario.next('/data/consented/illhistory/signs_symptoms_final_illness/Id10257');
						scenario.answer('yes');
						// assertThat(
						// 	scenario.refAtIndex().genericize(),
						// 	is(getRef('/data/consented/illhistory/signs_symptoms_final_illness/Id10257'))
						// );
						// endregion

						// region Answer "no" to almost the end of the form

						// JR:
						//
						// IntStream.range(0, 59).forEach((n) => {
						// 	scenario.next();
						// 	if (scenario.atQuestion()) scenario.answer('no');
						// });

						const next59References = [
							'/data/consented/illhistory/signs_symptoms_final_illness/Id10258',
							'/data/consented/illhistory/signs_symptoms_final_illness/Id10261',
							'/data/consented/illhistory/signs_symptoms_final_illness/Id10264',
							'/data/consented/illhistory/signs_symptoms_final_illness/Id10265',
							'/data/consented/illhistory/signs_symptoms_final_illness/Id10267',
							'/data/consented/illhistory/signs_symptoms_final_illness/Id10268',
							'/data/consented/illhistory/signs_symptoms_final_illness/Id10270',
							'/data/consented/illhistory/pregnancy_women',
							'/data/consented/illhistory/pregnancy_women/Id10294',
							'/data/consented/illhistory/pregnancy_women/Id10295',
							'/data/consented/illhistory/pregnancy_women/Id10296',
							'/data/consented/illhistory/pregnancy_women/Id10304',
							'/data/consented/illhistory/pregnancy_women/Id10305',

							// NOTE: these become relevant in the course of iterating through
							// these questions and answering "no". It may be worth introducing
							// additional assertions about that as they occur.
							'/data/consented/illhistory/pregnancy_women/Id10306',
							'/data/consented/illhistory/pregnancy_women/Id10307',
							'/data/consented/illhistory/pregnancy_women/Id10310',
							'/data/consented/illhistory/pregnancy_women/Id10310_check',

							'/data/consented/illhistory/pregnancy_women/group_maternal',
							'/data/consented/illhistory/pregnancy_women/group_maternal/Id10313',
							'/data/consented/illhistory/pregnancy_women/group_maternal/Id10317',
							'/data/consented/illhistory/pregnancy_women/group_maternal/Id10319',
							'/data/consented/illhistory/pregnancy_women/group_maternal/Id10321',
							'/data/consented/illhistory/pregnancy_women/group_maternal/Id10322',
							'/data/consented/illhistory/pregnancy_women/group_maternal/Id10323',
							'/data/consented/illhistory/pregnancy_women/group_maternal/Id10324',
							'/data/consented/illhistory/pregnancy_women/group_maternal/Id10325',
							'/data/consented/illhistory/pregnancy_women/group_maternal/Id10329',
							'/data/consented/illhistory/pregnancy_women/group_maternal/Id10333',
							'/data/consented/illhistory/pregnancy_women/group_maternal/Id10334',
							'/data/consented/illhistory/pregnancy_women/group_maternal/Id10337',
							'/data/consented/illhistory/pregnancy_women/group_maternal/Id10338',
							'/data/consented/illhistory/pregnancy_women/group_maternal/Id10339',

							// NOTE: these also become relevant while iterating/answering, may be
							// worth adding assertion.
							'/data/consented/illhistory/pregnancy_women/group_maternal/deliverytype',
							'/data/consented/illhistory/pregnancy_women/group_maternal/deliverytype/Id10342',
							'/data/consented/illhistory/pregnancy_women/group_maternal/deliverytype/Id10343',
							'/data/consented/illhistory/pregnancy_women/group_maternal/deliverytype/Id10344',

							'/data/consented/illhistory/Id10347',
							'/data/consented/illhistory/neonatal_child',
							'/data/consented/illhistory/risk_factors',
							'/data/consented/illhistory/risk_factors/Id10411',
							'/data/consented/illhistory/risk_factors/Id10412',
							'/data/consented/illhistory/risk_factors/Id10413',
							'/data/consented/illhistory/health_service_utilization',
							'/data/consented/illhistory/health_service_utilization/Id10418',
							'/data/consented/illhistory/health_service_utilization/Id10432',
							'/data/consented/illhistory/health_service_utilization/Id10435',
							'/data/consented/illhistory/health_service_utilization/Id10437',
							'/data/consented/back_context',
							'/data/consented/back_context/Id10450',
							'/data/consented/back_context/Id10455',
							'/data/consented/back_context/Id10456',
							'/data/consented/back_context/Id10457',
							'/data/consented/back_context/Id10458',
							'/data/consented/back_context/Id10459',
							'/data/consented/deathcert',
							'/data/consented/deathcert/Id10462',
							'/data/consented/narrat',
							'/data/consented/narrat/Id10476',
							'/data/consented/narrat/Id10477',
						];

						expect(next59References.length).toBe(59);

						next59References.forEach((expectedReference) => {
							scenario.next(expectedReference);

							if (scenario.atQuestion()) {
								if (skipWritesToNoteNodes) {
									try {
										scenario.answer('no');
									} catch {
										expect(scenario.getInstanceNode(expectedReference).nodeType).toBe('note');
									}
								} else {
									scenario.answer('no');
								}
							}
						});
						// endregion

						// region Answer the last question with comments
						scenario.next('/data/consented/comment');
						// assertThat(scenario.refAtIndex().genericize(), is(getRef('/data/consented/comment')));
						scenario.answer('No comments');

						scenario.next('END_OF_FORM');
						expect(scenario.atTheEndOfForm()).toBe(true);
						// endregion
					});
				}
			);
		});
	});
});

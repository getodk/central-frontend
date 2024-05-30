import {
	bind,
	body,
	head,
	html,
	item,
	mainInstance,
	model,
	select1,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import { describe, expect, it } from 'vitest';
import { stringAnswer } from '../src/answer/ExpectedStringAnswer.ts';
import { Scenario } from '../src/jr/Scenario.ts';
import { r } from '../src/jr/resource/ResourcePathHelper.ts';

// Ported as of https://github.com/getodk/javarosa/commit/5ae68946c47419b83e7d28290132d846e457eea6
describe('JavaRosa ports: ChoiceNameTest.java', () => {
	describe('jr:choice-name call on literal choice value', () => {
		it.fails('gets choice name', async () => {
			const scenario = await Scenario.init(r('jr-choice-name.xml'));

			expect(scenario.answerOf('/jr-choice-name/literal_choice_name')).toEqualAnswer(
				stringAnswer('Choice 2')
			);
		});
	});

	describe('choice name call outside of repeat with static choices', () => {
		it.fails('gets choice name', async () => {
			const scenario = await Scenario.init(r('jr-choice-name.xml'));

			expect(scenario.answerOf('/jr-choice-name/select_one_name_outside')).toEqualAnswer(
				stringAnswer('Choice 3')
			);
		});
	});

	describe('choice name call in repeat with static choices', () => {
		it.fails('gets choice name', async () => {
			const scenario = await Scenario.init(r('jr-choice-name.xml'));
			scenario.answer('/jr-choice-name/my-repeat[1]/select_one', 'choice4');
			scenario.answer('/jr-choice-name/my-repeat[2]/select_one', 'choice1');
			scenario.answer('/jr-choice-name/my-repeat[3]/select_one', 'choice5');

			expect(scenario.answerOf('/jr-choice-name/my-repeat[1]/select_one_name')).toEqualAnswer(
				stringAnswer('Choice 4')
			);
			expect(scenario.answerOf('/jr-choice-name/my-repeat[2]/select_one_name')).toEqualAnswer(
				stringAnswer('Choice 1')
			);
			expect(scenario.answerOf('/jr-choice-name/my-repeat[3]/select_one_name')).toEqualAnswer(
				stringAnswer('Choice 5')
			);
		});
	});

	describe('choice name call', () => {
		it.fails('respects language', async () => {
			const scenario = await Scenario.init(r('jr-choice-name.xml'));

			scenario.setLanguage('French (fr)');
			scenario.answer('/jr-choice-name/select_one_outside', 'choice3');
			expect(scenario.answerOf('/jr-choice-name/select_one_name_outside')).toEqualAnswer(
				stringAnswer('Choix 3')
			);
			scenario.answer('/jr-choice-name/my-repeat[1]/select_one', 'choice4');
			expect(scenario.answerOf('/jr-choice-name/my-repeat[1]/select_one_name')).toEqualAnswer(
				stringAnswer('Choix 4')
			);

			scenario.setLanguage('English (en)');
			// TODO (web-forms): per @lognaturel,
			// https://github.com/getodk/javarosa/issues/737 is pertinent.
			//
			// TODO (JR): why does test fail if value is not set to choice3 again?
			// Does changing language not trigger recomputation?
			scenario.answer('/jr-choice-name/select_one_outside', 'choice3');
			expect(scenario.answerOf('/jr-choice-name/select_one_name_outside')).toEqualAnswer(
				stringAnswer('Choice 3')
			);

			// TODO (JR): why does test fail if value is not set to choice4 again? Does changing language not trigger recomputation?
			scenario.answer('/jr-choice-name/my-repeat[1]/select_one', 'choice4');
			expect(scenario.answerOf('/jr-choice-name/my-repeat[1]/select_one_name')).toEqualAnswer(
				stringAnswer('Choice 4')
			);
		});
	});

	// The choice list for question cocotero with dynamic itemset is populated on DAG initialization time triggered by the jr:choice-name
	// expression in the calculate.
	describe('choice name call with dynamic choices and no predicate', () => {
		it.fails('selects name', async () => {
			const scenario = await Scenario.init(r('jr-choice-name.xml'));

			scenario.answer('/jr-choice-name/cocotero_a', 'a');
			scenario.answer('/jr-choice-name/cocotero_b', 'b');

			expect(scenario.answerOf('/jr-choice-name/cocotero_name')).toEqualAnswer(
				stringAnswer('Cocotero a-b')
			);
		});
	});

	// The choice list for question city with dynamic itemset is populated at DAG initialization time. Since country hasn't been
	// set yet, the choice list is empty. Setting the country does not automatically trigger re-computation of the choice list for the
	// city question. Instead, clients trigger a recomputation of the list when the list is displayed.
	describe('choice name call with dynamic choices and predicate', () => {
		it.fails('requires explicit dynamic choices recomputation', async () => {
			const scenario = await Scenario.init(
				'Dynamic Choices and Predicates',
				html(
					head(
						title('Dynamic Choices and Predicates'),
						model(
							mainInstance(
								t('data id="dynamic-choices-predicates"', t('country'), t('city'), t('city_name'))
							),

							t(
								'itext',
								t(
									'translation lang="default"',
									t('text id="static_instance-countries-0"', t('value', 'Canada')),
									t('text id="static_instance-countries-1"', t('value', 'France')),
									t('text id="static_instance-cities-0"', t('value', 'Montréal')),
									t('text id="static_instance-cities-1"', t('value', 'Grenoble'))
								)
							),

							t(
								'instance id="cities"',
								t(
									'root',
									t(
										'item',
										t('itextId', 'static_instance-cities-0'),
										t('name', 'montreal'),
										t('country', 'canada')
									),
									t(
										'item',
										t('itextId', 'static_instance-cities-1'),
										t('name', 'grenoble'),
										t('country', 'france')
									)
								)
							),
							bind('/data/country').type('string'),
							bind('/data/city').type('string'),
							bind('/data/city_name')
								.type('string')
								.calculate("jr:choice-name(/data/city,'/data/city')")
						)
					),
					body(
						select1('/data/country', item('canada', 'Canada'), item('france', 'France')),

						t(
							'select1 ref="/data/city"',
							t(
								'itemset nodeset="instance(\'cities\')/root/item[selected(country,/data/country)]"',
								t('value ref="name"'),
								t('label ref="jr:itext(itextId)"')
							)
						)
					)
				)
			);

			scenario.answer('/data/country', 'france');

			// Trigger recomputation of the city choice list
			expect(scenario.choicesOf('/data/city').get(0)?.getValue()).toBe('grenoble');

			scenario.answer('/data/city', 'grenoble');

			expect(scenario.answerOf('/data/city_name')).toEqualAnswer(stringAnswer('Grenoble'));
		});
	});
});

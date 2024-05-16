import { UpsertableMap } from '@getodk/common/lib/collections/UpsertableMap.ts';
import type { HtmlXFormsElement } from '@getodk/common/test/fixtures/xform-dsl/HtmlXFormsElement.ts';
import {
	body,
	head,
	html,
	instance,
	mainInstance,
	model,
	select1,
	select1Dynamic,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import { describe, expect, it } from 'vitest';
import { initializeForm } from '../../../src/index.ts';
import type { SelectField } from '../../../src/instance/SelectField.ts';
import type { createSelectItems } from '../../../src/lib/reactivity/createSelectItems.ts';
import { reactiveTestScope } from '../../helpers/reactive/internal.ts';

/**
 * @todo Consider these alternative testing strategies:
 *
 * - Reducing tests of reactive internals like {@link createSelectItems} to more
 *   conventional unit tests: If there's a reasonable way to do that, it would
 *   probably begin (especially in this case) with relaxing the
 *   {@link createSelectItems} signature to accept something more minimal than a
 *   {@link SelectField}. However, after some reflection on the efforts to port
 *   JavaRosa tests, there's quite a lot of value in form-level integration
 *   tests. We might benefit instead from...
 *
 * - Expanding the API of our ported `Scenario` class, itself now a full-fledged
 *   client of the engine, to support a more generalized approach to integration
 *   tests of the reactive aspects of our engline/client interface.
 *
 * The tests introduced in this suite are focused on both:
 *
 * 1. Testing the specific bugs reported in
 *    {@link https://github.com/getodk/web-forms/issues/83 | #83}, in support of
 *    the fixes that will accompany these tests.
 *
 * 2. Exploring some aspects of what we might want to consider if we move toward
 *    testing reactivity in the `scenario` integration test client package.
 */
describe('createSelectItems - reactive `<select>`/`<select1>` items and itemsets', () => {
	interface LabelTranslationSuite {
		readonly description: string;
		readonly fixture: HtmlXFormsElement;
	}

	/**
	 * Note that this test fixture is copied (with slight modification,
	 * disambiguating the primary instance root's `id` attribute) from a
	 * `scenario` integration test. We may want to consider strategies for sharing
	 * DSL-defined fixtures (even if it's just a matter of exporting and then
	 * importing them from some appropriate shared space). In considering that,
	 * let's also consider how that might integrate with dev and demo
	 * environments. We'd definitely benefit from a more direct mechanism to
	 * interact with, and inspect, test form fixtures within a UI client.
	 */
	const itemsetFixture = html(
		head(
			title('Multilingual dynamic select'),
			model(
				t(
					'itext',
					t(
						"translation lang='fr'",
						t("text id='choices-0'", t('value', 'A (fr)')),
						t("text id='choices-1'", t('value', 'B (fr)')),
						t("text id='choices-2'", t('value', 'C (fr)'))
					),
					t(
						"translation lang='en'",
						t("text id='choices-0'", t('value', 'A (en)')),
						t("text id='choices-1'", t('value', 'B (en)')),
						t("text id='choices-2'", t('value', 'C (en)'))
					)
				),
				mainInstance(t("data id='multilingual-dynamic-select'", t('select'))),

				instance(
					'choices',
					t('item', t('itextId', 'choices-0'), t('name', 'a')),
					t('item', t('itextId', 'choices-1'), t('name', 'b')),
					t('item', t('itextId', 'choices-2'), t('name', 'c'))
				)
			)
		),
		body(
			select1Dynamic('/data/select', "instance('choices')/root/item", 'name', 'jr:itext(itextId)')
		)
	);

	const itemsFixture = html(
		head(
			title('Multilingual static select'),
			model(
				t(
					'itext',
					t(
						"translation lang='fr'",
						t("text id='choices-0'", t('value', 'A (fr)')),
						t("text id='choices-1'", t('value', 'B (fr)')),
						t("text id='choices-2'", t('value', 'C (fr)'))
					),
					t(
						"translation lang='en'",
						t("text id='choices-0'", t('value', 'A (en)')),
						t("text id='choices-1'", t('value', 'B (en)')),
						t("text id='choices-2'", t('value', 'C (en)'))
					)
				),
				mainInstance(t("data id='multilingual-static-select'", t('select')))
			)
		),
		body(
			select1(
				'/data/select',
				t('item', t('value', 'a'), t('label ref="jr:itext(\'choices-0\')"')),
				t('item', t('value', 'b'), t('label ref="jr:itext(\'choices-1\')"')),
				t('item', t('value', 'c'), t('label ref="jr:itext(\'choices-2\')"'))
			)
		)
	);

	describe.each<LabelTranslationSuite>([
		{
			description: 'dynamic `<itemset>` label translations',
			fixture: itemsetFixture,
		},
		{
			description: 'static `<item>` label translations',
			fixture: itemsFixture,
		},
	])('$description', ({ fixture }) => {
		type TestLanguage = 'en' | 'fr';

		/**
		 * @todo What would a generalization of this pattern look like, if we were to
		 * add reactive testing to `scenario`?
		 *
		 * These immediately come to mind:
		 *
		 * 1. Can {@link act} be declarative? Can we specify a series of generic
		 *    action steps to be taken against a form, in a relatively uniform way,
		 *    and apply that format to arbitrary form fixtures?
		 *
		 * 2. Can {@link assert} be made more generic as some sort of expected
		 *    reactive event log?
		 *
		 * 3. Could we interleave these. It's likely we'd want to be able to step
		 *    through a series of {@link act} steps, and perform an {@link assert}
		 *    check associated with that step, to make it clearer which observed state
		 *    is (expected to be) produced by each state change action.
		 */
		interface TranslatedItemLabelTestCase {
			readonly description: string;

			readonly act: {
				readonly setLanguage: readonly TestLanguage[];
			};

			readonly assert: {
				readonly observedLabels: {
					readonly a: readonly string[];
					readonly b: readonly string[];
					readonly c: readonly string[];
				};
			};
		}

		it.each<TranslatedItemLabelTestCase>([
			{
				description: 'default labels on init',
				act: {
					setLanguage: [],
				},
				assert: {
					observedLabels: {
						a: ['A (fr)'],
						b: ['B (fr)'],
						c: ['C (fr)'],
					},
				},
			},
			{
				description: 'alternate between languages',
				act: {
					setLanguage: ['en', 'fr', 'en'],
				},
				assert: {
					observedLabels: {
						a: ['A (fr)', 'A (en)', 'A (fr)', 'A (en)'],
						b: ['B (fr)', 'B (en)', 'B (fr)', 'B (en)'],
						c: ['C (fr)', 'C (en)', 'C (fr)', 'C (en)'],
					},
				},
			},
			{
				description: 'redundant language selection is reactive no-op',
				act: {
					setLanguage: ['fr', 'fr', 'fr', 'en', 'en', 'en'],
				},
				assert: {
					observedLabels: {
						a: ['A (fr)', 'A (en)'],
						b: ['B (fr)', 'B (en)'],
						c: ['C (fr)', 'C (en)'],
					},
				},
			},
		])('triggers translated select label - $description', async ({ act, assert }) => {
			const labelStatesByValue = await reactiveTestScope(async ({ effect, mutable }) => {
				const root = await initializeForm(fixture.asXml(), {
					config: {
						stateFactory: mutable,
					},
				});
				const [fr, en, ...restLanguages] = root.languages;

				if (fr.language !== 'fr') {
					expect.fail(`Unexpected default language: ${fr.language}`);
				}

				if (en == null || en.language !== 'en') {
					expect.fail(`Unexpected alternate language: ${en?.language}`);
				}

				expect(restLanguages).toEqual([]);

				const select = root.currentState.children[0];

				if (
					select == null ||
					select.nodeType !== 'select' ||
					select.currentState.reference !== '/data/select'
				) {
					expect.fail('Failed to find select for testing its reactive label translations');
				}

				expect(select.currentState.reference).toBe('/data/select');

				const observedLabelStatesByValue = new UpsertableMap<string, string[]>();

				// Note: with current internal test reactivity, this should be run
				// eagerly; the initial label state (in "French") should be observed
				// immediately upon its definition.
				effect(() => {
					select.currentState.valueOptions.forEach((option) => {
						const { label, value } = option;
						const labelStates = observedLabelStatesByValue.upsert(value, () => []);

						if (label == null) {
							expect.fail(`Select item with value ${value} has no label`);
						}

						labelStates.push(label.asString);
					});
				});

				const languages = {
					fr,
					en,
				} as const;

				act.setLanguage.forEach((languageKey) => {
					const language = languages[languageKey];

					root.setLanguage(language);
				});

				return Object.fromEntries(observedLabelStatesByValue);
			});

			expect(labelStatesByValue).toEqual(assert.observedLabels);
		});
	});
});

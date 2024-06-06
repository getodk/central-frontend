import { BodyXFormsElement } from '@getodk/common/test/fixtures/xform-dsl/BodyXFormsElement.ts';
import { TagXFormsElement } from '@getodk/common/test/fixtures/xform-dsl/TagXFormsElement.ts';
import type { XFormsElement } from '@getodk/common/test/fixtures/xform-dsl/XFormsElement.ts';
import {
	body,
	head,
	html,
	input,
	mainInstance,
	model,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import { describe, expect, it } from 'vitest';
import { Scenario } from '../src/jr/Scenario.ts';

const element = (
	name: string,
	ref: string,
	appearances: readonly string[],
	...children: XFormsElement[]
): XFormsElement => {
	return new TagXFormsElement(
		name,
		new Map([
			['ref', ref],
			['appearance', appearances.join(' ')],
		]),
		children
	);
};

describe('Appearances', () => {
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	type AppearanceCategory = 'documented' | 'arbitrary' | 'mixed';

	interface AppearanceTestCase {
		readonly category: AppearanceCategory;
		readonly appearances: readonly string[];
	}

	describe('<input>', () => {
		const inputCases: readonly AppearanceTestCase[] = [
			{
				category: 'documented',
				appearances: ['multiline'],
			},
			{
				category: 'documented',
				appearances: ['numbers', 'masked'],
			},
			{
				category: 'arbitrary',
				appearances: ['bold', 'round'],
			},
			{
				category: 'mixed',
				appearances: ['hidden', 'url'],
			},
		];

		const inputFixture = (appearances: readonly string[]): XFormsElement => {
			// prettier-ignore
			return html(
				head(
					title('Input appearances'),
					model(
						mainInstance(
							t('data id="appearances-fixture"',
								t('inp'))))),
				body(
					element('input', '/data/inp', appearances)
				),
			);
		};

		it.each<AppearanceTestCase>(inputCases)(
			'gets the $category appearances $appearances defined on an input',
			async ({ appearances }) => {
				const scenario = await Scenario.init('Input appearances', inputFixture(appearances));

				const node = scenario.getInstanceNode('/data/inp');

				appearances.forEach((appearance) => {
					expect(node).toHaveAppearance(appearance);
				});
			}
		);

		it.each<AppearanceTestCase>(inputCases)(
			'iterates the $category appearances $appearances defined on an input',
			async ({ appearances }) => {
				const scenario = await Scenario.init('Input appearances', inputFixture(appearances));

				const node = scenario.getInstanceNode('/data/inp');

				expect(node).toYieldAppearances(appearances);
			}
		);

		it('does not get appearances not present in the form definition', async () => {
			const scenario = await Scenario.init('Input appearances', inputFixture(['no-calendar']));

			const node = scenario.getInstanceNode('/data/inp');

			expect(node).notToHaveAppearance('month-year');
		});
	});

	interface SelectSuiteOptions {
		readonly selectTag: 'select' | 'select1';
	}

	describe.each<SelectSuiteOptions>([{ selectTag: 'select' }, { selectTag: 'select1' }])(
		'<$selectTag>',
		({ selectTag }) => {
			const selectCases: readonly AppearanceTestCase[] = [
				{
					category: 'documented',
					appearances: ['compact'],
				},
				{
					category: 'documented',
					appearances: ['columns', 'autocomplete'],
				},
				{
					category: 'arbitrary',
					appearances: ['bold', 'round'],
				},
				{
					category: 'mixed',
					appearances: ['hidden', 'url'],
				},
			];

			const selectFixture = (appearances: readonly string[]): XFormsElement => {
				// prettier-ignore
				return html(
				head(
					title('Select appearances'),
					model(
						mainInstance(
							t('data id="appearances-fixture"',
								t('sel'))))),
				body(
					element(selectTag, '/data/sel', appearances)
				),
			);
			};

			it.each<AppearanceTestCase>(selectCases)(
				`gets the $category appearances $appearances defined on a ${selectTag}`,
				async ({ appearances }) => {
					const scenario = await Scenario.init('Select appearances', selectFixture(appearances));

					const node = scenario.getInstanceNode('/data/sel');

					appearances.forEach((appearance) => {
						expect(node).toHaveAppearance(appearance);
					});
				}
			);

			it.each<AppearanceTestCase>(selectCases)(
				`iterates the $category appearances $appearances defined on a ${selectTag}`,
				async ({ appearances }) => {
					const scenario = await Scenario.init('Select appearances', selectFixture(appearances));

					const node = scenario.getInstanceNode('/data/sel');

					expect(node).toYieldAppearances(appearances);
				}
			);

			it('does not get appearances not present in the form definition', async () => {
				const scenario = await Scenario.init('Select appearances', selectFixture(['columns-1']));

				const node = scenario.getInstanceNode('/data/sel');

				expect(node).notToHaveAppearance('columns-2');
			});

			describe('aliases', () => {
				it('gets the "autocomplete" appearance alias when the "search" appearance is defined', async () => {
					const scenario = await Scenario.init('Select appearances', selectFixture(['search']));

					const node = scenario.getInstanceNode('/data/sel');

					expect(node).toHaveAppearance('autocomplete');
				});

				it('gets the deprecated "search" appearance when the "search" appearance is defined', async () => {
					const scenario = await Scenario.init('Select appearances', selectFixture(['search']));

					const node = scenario.getInstanceNode('/data/sel');

					expect(node).toHaveAppearance('search');
				});

				it('yields both the deprecated "search" and aliased "autocomplete" appearances when the "search" appearance is defined', async () => {
					const scenario = await Scenario.init('Select appearances', selectFixture(['search']));

					const node = scenario.getInstanceNode('/data/sel');

					expect(node).toYieldAppearances(['autocomplete', 'search']);
				});
			});
		}
	);

	describe('<group>', () => {
		const groupCases: readonly AppearanceTestCase[] = [
			{
				category: 'documented',
				appearances: ['field-list'],
			},
			{
				category: 'documented',
				appearances: ['table-list'],
			},
			{
				category: 'arbitrary',
				appearances: ['task-list', 'shopping-list'],
			},
			{
				category: 'mixed',
				appearances: ['field-list', 'shopping-list'],
			},
		];

		const groupFixture = (appearances: readonly string[]): XFormsElement => {
			// prettier-ignore
			return html(
				head(
					title('Group appearances'),
					model(
						mainInstance(
							t('data id="appearances-fixture"',
								t('grp',
									t('inp')))))),
				body(
					element('group', '/data/grp', appearances,
						input('/data/grp/inp')
					)
				),
			);
		};

		it.each<AppearanceTestCase>(groupCases)(
			'looks up the $category appearances $appearances by name, when defined on a group',
			async ({ appearances }) => {
				const scenario = await Scenario.init('Group appearances', groupFixture(appearances));

				const node = scenario.getInstanceNode('/data/grp');

				appearances.forEach((appearance) => {
					expect(node).toHaveAppearance(appearance);
				});
			}
		);

		it.each<AppearanceTestCase>(groupCases)(
			'iterates the $category appearances $appearances defined on a group',
			async ({ appearances }) => {
				const scenario = await Scenario.init('Group appearances', groupFixture(appearances));

				const node = scenario.getInstanceNode('/data/grp');

				expect(node).toYieldAppearances(appearances);
			}
		);

		it('does not get appearances not present in the form definition', async () => {
			const scenario = await Scenario.init('Group appearances', groupFixture(['field-list']));

			const node = scenario.getInstanceNode('/data/grp');

			expect(node).notToHaveAppearance('something-else');
		});
	});

	describe('<repeat>', () => {
		const repeatCases: readonly AppearanceTestCase[] = [
			{
				category: 'documented',
				appearances: ['field-list'],
			},
			{
				category: 'documented',
				appearances: ['table-list'],
			},
			{
				category: 'arbitrary',
				appearances: ['task-list', 'shopping-list'],
			},
			{
				category: 'mixed',
				appearances: ['field-list', 'shopping-list'],
			},
		];

		const repeatFixture = (appearances: readonly string[]): XFormsElement => {
			// prettier-ignore
			return html(
				head(
					title('Repeat appearances'),
					model(
						mainInstance(
							t('data id="appearances-fixture"',
								t('rep jr:template=""',
									t('inp')),
								t('rep',
									t('inp')),
								t('rep',
									t('inp')))))),
				body(
					element('repeat', '/data/rep', appearances,
						input('/data/rep/inp')
					)
				),
			);
		};

		it.each<AppearanceTestCase>(repeatCases)(
			'gets the $category appearances $appearances defined on a repeat range',
			async ({ appearances }) => {
				const scenario = await Scenario.init('Repeat appearances', repeatFixture(appearances));

				const node = scenario.getInstanceNode('/data/rep');

				appearances.forEach((appearance) => {
					expect(node).toHaveAppearance(appearance);
				});
			}
		);

		it.each<AppearanceTestCase>(repeatCases)(
			'gets the $category appearances $appearances defined on a repeat, for each individual repeat instance',
			async ({ appearances }) => {
				const scenario = await Scenario.init('Repeat appearances', repeatFixture(appearances));

				const nodes = [
					scenario.getInstanceNode('/data/rep[1]'),
					scenario.getInstanceNode('/data/rep[2]'),
				];

				nodes.forEach((node) => {
					appearances.forEach((appearance) => {
						expect(node).toHaveAppearance(appearance);
					});
				});
			}
		);

		it.each<AppearanceTestCase>(repeatCases)(
			'iterates the $category appearances $appearances defined on a repeat range',
			async ({ appearances }) => {
				const scenario = await Scenario.init('Repeat appearances', repeatFixture(appearances));

				const node = scenario.getInstanceNode('/data/rep');

				expect(node).toYieldAppearances(appearances);
			}
		);

		it.each<AppearanceTestCase>(repeatCases)(
			'iterates the $category appearances $appearances defined on a repeat, for each individual repeat instance',
			async ({ appearances }) => {
				const scenario = await Scenario.init('Repeat appearances', repeatFixture(appearances));

				const nodes = [
					scenario.getInstanceNode('/data/rep[1]'),
					scenario.getInstanceNode('/data/rep[2]'),
				];

				nodes.forEach((node) => {
					expect(node).toYieldAppearances(appearances);
				});
			}
		);

		it('does not get appearances not present in the form definition', async () => {
			const scenario = await Scenario.init('Repeat appearances', repeatFixture(['field-list']));

			const nodes = [
				scenario.getInstanceNode('/data/rep'),
				scenario.getInstanceNode('/data/rep[1]'),
				scenario.getInstanceNode('/data/rep[2]'),
			];

			nodes.forEach((node) => {
				expect(node).notToHaveAppearance('something-else');
			});
		});
	});
});

describe('<h:body> classes', () => {
	class BodyXFormsElementWithAttributes extends TagXFormsElement implements BodyXFormsElement {
		override readonly name = 'h:body';

		constructor(attributes: Record<string, string>, children: XFormsElement[]) {
			super('h:body', new Map(Object.entries(attributes)), children);
		}
	}

	const bodyWithAttributes = (
		attributes: Record<string, string>,
		...children: XFormsElement[]
	): BodyXFormsElement => {
		return new BodyXFormsElementWithAttributes(attributes, children);
	};

	// prettier-ignore
	const bodyClassesFixture = html(
		head(
			title('Body classes'),
			model(
				mainInstance(
					t('data id="appearances-fixture"',
						t('inp'))))),
		bodyWithAttributes(
			{ class: 'pages theme-grid' },
			input('/data/inp')
		),
	);

	it('gets the classes defined on the form body from the instance root node', async () => {
		const scenario = await Scenario.init('Body classes', bodyClassesFixture);
		const rootNode = scenario.getInstanceNode('/data');

		expect(rootNode).toHaveClass('pages');
		expect(rootNode).toHaveClass('theme-grid');
		expect(rootNode).notToHaveClass('something-else');
	});

	it('iterates the classes defined on the form body from the instance root node', async () => {
		const scenario = await Scenario.init('Body classes', bodyClassesFixture);
		const rootNode = scenario.getInstanceNode('/data');

		expect(rootNode).toYieldClasses(['pages', 'theme-grid']);
	});
});

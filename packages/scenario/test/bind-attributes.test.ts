import {
	bind,
	body,
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
import { beforeEach, describe, expect, it } from 'vitest';
import { Scenario } from '../src/jr/Scenario.ts';

const IGNORED_INSTANCE_ID = 'ignored for purposes of functionality under test';

describe('Bind to element attributes', () => {
	describe('can bind to parent nodes', () => {
		const formDefinition = html(
			head(
				title('Bind attributes'),
				model(
					mainInstance(
						t(
							'root id="bind-attributes" version=""',
							t('grp version="" uuid=""', t('version'), t('test version=""', 'default id value')),
							t('orx:meta', t('orx:instanceID', IGNORED_INSTANCE_ID))
						)
					),
					bind('/root/grp/version').type('string'),
					// can bind to root
					bind('/root/@version').type('string').calculate('/root/grp/version').readonly('true()'),
					// can bind to group
					bind('/root/grp/@version')
						.type('string')
						.calculate('/root/grp/version')
						.readonly('true()'),
					// can bind to leaf
					bind('/root/grp/test/@version')
						.type('string')
						.calculate('/root/grp/version')
						.readonly('true()'),
					bind('/root/grp/@uuid').type('string').calculate('/root/grp/test').readonly('true()')
				)
			),
			body(input('/root/grp/version'), input('/root/grp/test'))
		);

		let scenario: Scenario;

		async function expectVersion(id: string, version: string) {
			const actual = await scenario.prepareWebFormsInstancePayload();
			const expected = t(
				`root xmlns:orx="http://openrosa.org/xforms" id="bind-attributes" version="${version}"`,
				t(
					`grp uuid="${id}" version="${version}"`,
					t('version', version),
					t(`test version="${version}"`, id)
				),
				t('orx:meta', t('orx:instanceID', IGNORED_INSTANCE_ID))
			).asXml();
			await expect(actual).toHavePreparedSubmissionXML(expected);
		}

		beforeEach(async () => {
			scenario = await Scenario.init('Bind attributes', formDefinition);
		});

		describe('version is bound', () => {
			it('has a string runtime value', async () => {
				await expectVersion('default id value', '');
				scenario.answer('/root/grp/version', 'someversion');
				await expectVersion('default id value', 'someversion');
			});
		});
	});

	describe('ignores jr:template attributes', () => {
		it('serializes correctly', async () => {
			const scenario = await Scenario.init(
				'Repeat serde (basic + calculate)',
				html(
					head(
						title('Repeat serde (basic + calculate)'),
						model(
							mainInstance(
								t(
									'data id="repeat-serde-basic-calculate"',
									t('repeat jr:template=""', t('inner1', '4')),
									t('orx:meta', t('orx:instanceID', IGNORED_INSTANCE_ID))
								)
							)
						)
					),

					body(repeat('/data/repeat', input('/data/repeat/inner1', label('inner1'))))
				)
			);

			scenario.next('/data/repeat');
			scenario.createNewRepeat({ assertCurrentReference: '/data/repeat' });

			const actual = await scenario.prepareWebFormsInstancePayload();
			const expected = t(
				'data xmlns:orx="http://openrosa.org/xforms" id="repeat-serde-basic-calculate"',
				t('repeat', t('inner1', '4')),
				t('orx:meta', t('orx:instanceID', IGNORED_INSTANCE_ID))
			).asXml();
			await expect(actual).toHavePreparedSubmissionXML(expected);
		});
	});
});

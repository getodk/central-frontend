import type { JRResourceURL } from '@getodk/common/jr-resources/JRResourceURL.ts';
import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import {
	bind,
	body,
	head,
	html,
	input,
	mainInstance,
	model,
	t,
	title,
} from '@getodk/common/test-utils/xform-dsl/index.ts';
import type { XFormsElement } from '@getodk/common/test-utils/xform-dsl/XFormsElement.ts';
import type { TextRange } from '@getodk/xforms-engine';
import { describe, expect, it } from 'vitest';
import { Scenario } from '../scenario/jr/Scenario.ts';

describe('`<label>` with media', () => {
	const FORMS = ['image', 'video', 'audio'] as const;
	type Form = (typeof FORMS)[number];

	const getSource = (label: TextRange<'label'>, form: Form): JRResourceURL | undefined => {
		if (form === 'image') {
			return label.imageSource;
		}
		if (form === 'video') {
			return label.videoSource;
		}
		if (form === 'audio') {
			return label.audioSource;
		}
		throw new UnreachableError(form);
	};

	const getFilePath = (form: Form) => {
		if (form === 'image') {
			return 'jr://images/';
		}
		if (form === 'video') {
			return 'jr://images/';
		}
		if (form === 'audio') {
			return 'jr://images/';
		}
		throw new UnreachableError(form);
	};

	const init = async (translationValue: XFormsElement) => {
		return await Scenario.init(
			'media-image',
			html(
				head(
					title('media'),
					model(
						t(
							'itext',
							t(
								'translation lang="default"',
								t('text id="/data/name:label"', t('value', 'Name'), translationValue)
							)
						),
						mainInstance(t('data id="media"', t('name'))),
						bind('/data/name').type('string')
					)
				),
				body(input('/data/name', t(`label ref="jr:itext('/data/name:label')"`)))
			)
		);
	};

	for (const form of FORMS) {
		describe(`form: "${form}"`, () => {
			it('includes the URL', async () => {
				const file = getFilePath(form) + 'my-file.ext';
				const scenario = await init(t(`value form="${form}"`, file));

				scenario.next('/data/name');
				const label = scenario.getQuestionLabel({
					assertCurrentReference: '/data/name',
				});

				expect(label.asString).to.equal('Name');
				const source = getSource(label, form);
				expect(source?.toString()).toEqual(file);
			});

			it('calculates the URL', async () => {
				const filename = 'my-file.ext';
				const path = getFilePath(form);
				const scenario = await init(
					t(`value form="${form}"`, ` ${path}<output value=" /data/name "/> `)
				);

				scenario.next('/data/name');
				scenario.answer('/data/name', filename);

				const label = scenario.getQuestionLabel({
					assertCurrentReference: '/data/name',
				});

				expect(label.asString).to.equal('Name');
				const source = getSource(label, form);
				expect(source?.toString()).to.equal(path + filename);
			});
		});
	}
});

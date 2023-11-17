import { beforeEach, describe, expect, it } from 'vitest';
import {
	bind,
	body,
	head,
	html,
	mainInstance,
	model,
	t,
	title,
} from '../../test/fixtures/xform-dsl';
import { XFormDefinition } from './XFormDefinition';
import { XFormModelBind } from './XFormModelBind';
import type { ReadonlyXFormModelBindMap } from './XFormModelBindMap';

describe('XFormModelBindMap', () => {
	let binds: ReadonlyXFormModelBindMap;

	beforeEach(() => {
		const xform = html(
			head(
				title('Bind types'),
				model(
					mainInstance(
						t(
							'root id="bind-types"',
							t(
								'group',
								t('first-question'),
								t(
									'sub-group',
									// Preserve indentation
									t(
										'deep-group',
										// ...
										t('second-question')
									)
								),
								t('third-question')
							)
						)
					),
					bind('/root/group/first-question').calculate('/root/group/third-question * 2'),
					bind('/root/group/sub-group/deep-group').relevant('/root/group/first-question != 10'),
					bind('/root/group/sub-group/deep-group/second-question').relevant(
						'/root/group/third-question != 10'
					),
					bind('/root/group/third-question').type('int')
				)
			),
			body()
		);
		const form = new XFormDefinition(xform.asXml());

		binds = form.model.binds;
	});

	it('includes parent nodesets without explicit binds (for ancestor relevance)', () => {
		expect(binds.get('/root/group')).toBeInstanceOf(XFormModelBind);
		expect(binds.get('/root/group/sub-group')).toBeInstanceOf(XFormModelBind);
	});

	it('sorts nodesets based on bind computation dependencies', () => {
		const keys = Array.from(binds.keys());

		expect(keys).toEqual([
			'/root',
			'/root/group',
			'/root/group/third-question',
			'/root/group/first-question',
			'/root/group/sub-group',
			'/root/group/sub-group/deep-group',
			'/root/group/sub-group/deep-group/second-question',
		]);
	});
});

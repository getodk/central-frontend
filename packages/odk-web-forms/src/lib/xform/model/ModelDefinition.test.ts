import { beforeEach, describe, expect, it } from 'vitest';
import {
	bind,
	body,
	head,
	html,
	input,
	label,
	mainInstance,
	model,
	t,
	title,
} from '../../../test/fixtures/xform-dsl/index.ts';
import { XFormDefinition } from '../XFormDefinition.ts';
import { BindDefinition } from './BindDefinition.ts';
import { ModelDefinition } from './ModelDefinition.ts';

describe('ModelDefinition', () => {
	let modelDefinition: ModelDefinition;

	beforeEach(() => {
		const xform = html(
			head(
				title('Model definition'),
				model(
					mainInstance(
						t(
							`root id="model-definition"`,
							t('first-question'),
							t('second-question'),
							t('third-question')
						)
					),
					bind('/root/first-question').type('string'),
					bind('/root/second-question').type('string'),
					bind('/root/third-question').type('string')
				)
			),
			body(
				input('/root/first-question', label('First question')),
				input('/root/second-question'),
				t('unknown-control ref="/root/third-question"')
			)
		);

		const xformDefinition = new XFormDefinition(xform.asXml());

		modelDefinition = xformDefinition.model;
	});

	it.each([
		{ nodeset: '/root/first-question' },
		{ nodeset: '/root/second-question' },
		{ nodeset: '/root/third-question' },
	])('defines model bindings for $nodeset', ({ nodeset }) => {
		const bindDefinition = modelDefinition.binds.get(nodeset);

		expect(bindDefinition).toBeInstanceOf(BindDefinition);
	});
});
